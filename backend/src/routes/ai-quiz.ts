import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { GoogleGenAI } from '@google/genai';
import { PDFParse } from 'pdf-parse';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const router = Router();

type QuestionStatus = 'pending' | 'approved' | 'rejected';

const uploadSchema = z.object({
    title: z.string().trim().min(1).max(150),
    fileUrl: z.string().url(),
    filePath: z.string().trim().min(1).max(500).optional(),
});

const updateDocumentSchema = z.object({
    title: z.string().trim().min(1).max(150),
});

const replaceDocumentFileSchema = z.object({
    fileUrl: z.string().url(),
    filePath: z.string().trim().min(1).max(500).optional(),
});

const aiQuestionSchema = z.object({
    question: z.string().trim().min(1).max(500),
    options: z.array(z.string().trim().min(1).max(200)).length(4),
    correctIndex: z.number().int().min(0).max(3),
});

const createManualQuestionSchema = z.object({
    question: z.string().trim().min(1).max(500),
    options: z.array(z.string().trim().min(1).max(200)).length(4),
    correctIndex: z.number().int().min(0).max(3),
    status: z.enum(['pending', 'approved', 'rejected']).optional().default('pending'),
});

const updateManualQuestionSchema = z.object({
    question: z.string().trim().min(1).max(500),
    options: z.array(z.string().trim().min(1).max(200)).length(4),
    correctIndex: z.number().int().min(0).max(3),
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

const updateStatusSchema = z.object({
    status: z.enum(['approved', 'rejected', 'pending']),
});

const aiQuestionsSchema = z.array(aiQuestionSchema).length(3);
const geminiModels = (process.env.GEMINI_MODELS ?? 'gemini-2.5-flash,gemini-3.5-flash')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
    let timer: NodeJS.Timeout | null = null;
    try {
        const timeoutPromise = new Promise<T>((_, reject) => {
            timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
        });
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        if (timer) clearTimeout(timer);
    }
}

function isRetryableModelError(error: unknown) {
    if (!error || typeof error !== 'object') return false;
    const status = (error as { status?: number }).status;
    return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

async function wait(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithFallback(prompt: string) {
    let lastError: unknown = null;
    const maxAttempts = Number(process.env.GEMINI_RETRY_ATTEMPTS ?? 2);

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        for (const model of geminiModels) {
            try {
                return await withTimeout(
                    ai.models.generateContent({
                        model,
                        contents: prompt,
                        config: {
                            responseMimeType: 'application/json',
                        }
                    }),
                    35000,
                    `AI generation (${model})`
                );
            } catch (error) {
                lastError = error;
                const retryable = isRetryableModelError(error);
                console.warn(`[ai-quiz] model failed: ${model} (attempt ${attempt}/${maxAttempts})`, error);

                if (!retryable) {
                    continue;
                }
            }
        }

        if (attempt < maxAttempts) {
            const backoffMs = Math.min(3000, 700 * Math.pow(2, attempt - 1));
            await wait(backoffMs);
        }
    }

    throw lastError ?? new Error('All Gemini models failed');
}

function extractJsonPayload(text: string) {
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    if (!cleaned) return '[]';

    if (cleaned.startsWith('[') || cleaned.startsWith('{')) return cleaned;

    const firstArray = cleaned.indexOf('[');
    const lastArray = cleaned.lastIndexOf(']');
    if (firstArray >= 0 && lastArray > firstArray) {
        return cleaned.slice(firstArray, lastArray + 1);
    }

    const firstObj = cleaned.indexOf('{');
    const lastObj = cleaned.lastIndexOf('}');
    if (firstObj >= 0 && lastObj > firstObj) {
        return cleaned.slice(firstObj, lastObj + 1);
    }

    return cleaned;
}

function normalizeAIQuestions(raw: unknown) {
    let candidates: unknown[] = [];

    if (Array.isArray(raw)) {
        candidates = raw;
    } else if (raw && typeof raw === 'object') {
        const obj = raw as Record<string, unknown>;
        const list = obj.questions ?? obj.items ?? obj.data ?? obj.result ?? obj.quiz;
        if (Array.isArray(list)) candidates = list;
    }

    return candidates
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const q = item as Record<string, unknown>;

            const question = String(
                q.question ?? q.cauHoi ?? q.cau_hoi ?? q.content ?? q.text ?? ''
            ).trim();

            const rawOptions = q.options ?? q.answers ?? q.choices ?? q.luaChon ?? q.lua_chon;
            const optionsArray = Array.isArray(rawOptions)
                ? rawOptions
                : rawOptions && typeof rawOptions === 'object'
                    ? Object.values(rawOptions)
                    : [];

            const options = optionsArray
                .map((opt) => String(opt ?? '').trim())
                .filter((opt) => opt.length > 0)
                .slice(0, 4);

            if (!question || options.length !== 4) return null;

            const rawCorrect = q.correctIndex ?? q.correct_index ?? q.answerIndex ?? q.answer_index ?? q.correct ?? q.correctAnswer ?? q.dapAn ?? q.dap_an;

            let correctIndex = -1;
            if (typeof rawCorrect === 'number' && Number.isInteger(rawCorrect)) {
                correctIndex = rawCorrect;
            } else if (typeof rawCorrect === 'string') {
                const trimmed = rawCorrect.trim();
                if (/^[0-3]$/.test(trimmed)) {
                    correctIndex = Number(trimmed);
                } else if (/^[A-D]$/i.test(trimmed)) {
                    correctIndex = trimmed.toUpperCase().charCodeAt(0) - 65;
                } else {
                    const found = options.findIndex((opt) => opt.toLowerCase() === trimmed.toLowerCase());
                    correctIndex = found;
                }
            }

            if (correctIndex < 0 || correctIndex > 3) return null;

            return {
                question,
                options,
                correctIndex,
            };
        })
        .filter((x): x is { question: string; options: string[]; correctIndex: number } => !!x)
        .slice(0, 3);
}

function parseAIResponse(jsonText: string) {
    const jsonPayload = extractJsonPayload(jsonText);
    const raw = JSON.parse(jsonPayload || '[]');
    const normalized = normalizeAIQuestions(raw);
    const parsed = aiQuestionsSchema.safeParse(normalized);
    if (!parsed.success) {
        throw new Error('AI returned invalid question format');
    }
    return parsed.data;
}

function isLocalOrPrivateHost(hostname: string) {
    const host = hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true;

    const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!ipv4) return false;

    const octets = ipv4.slice(1).map((x) => Number(x));
    if (octets.some((x) => !Number.isInteger(x) || x < 0 || x > 255)) return false;

    const [a, b] = octets;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;

    return false;
}

function isAllowedFileUrl(fileUrl: string) {
    const url = new URL(fileUrl);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') return false;
    if (isLocalOrPrivateHost(url.hostname)) return false;
    return true;
}

function getParamId(idParam: string | string[]) {
    return Array.isArray(idParam) ? idParam[0] : idParam;
}

async function isDocumentOwnedByParent(documentId: string, parentId: string) {
    const { data, error } = await supabaseAdmin
        .from('pdf_documents')
        .select('id')
        .eq('id', documentId)
        .eq('parent_id', parentId)
        .maybeSingle();

    return !error && !!data;
}

async function isDocumentAssignedToChild(documentId: string, childId: string) {
    const { data, error } = await supabaseAdmin
        .from('assigned_ai_quizzes')
        .select('id')
        .eq('document_id', documentId)
        .eq('child_id', childId)
        .neq('status', 'cancelled')
        .maybeSingle();

    return !error && !!data;
}

async function getOwnedQuestion(questionId: string, parentId: string) {
    const { data: questionRow, error: questionError } = await supabaseAdmin
        .from('pdf_questions')
        .select('id, document_id')
        .eq('id', questionId)
        .maybeSingle();

    if (questionError || !questionRow) return null;

    const owned = await isDocumentOwnedByParent(questionRow.document_id, parentId);
    if (!owned) return null;

    return questionRow;
}

async function getCompletedAssignmentCount(documentId: string, parentId: string) {
    const { count, error } = await supabaseAdmin
        .from('assigned_ai_quizzes')
        .select('id', { count: 'exact', head: true })
        .eq('document_id', documentId)
        .eq('parent_id', parentId)
        .eq('status', 'completed');

    if (error) throw new Error(error.message);
    return count ?? 0;
}

async function getActiveAssignmentCount(documentId: string, parentId: string) {
    const { count, error } = await supabaseAdmin
        .from('assigned_ai_quizzes')
        .select('id', { count: 'exact', head: true })
        .eq('document_id', documentId)
        .eq('parent_id', parentId)
        .neq('status', 'cancelled');

    if (error) throw new Error(error.message);
    return count ?? 0;
}

async function deleteQuestionsForRegeneration(documentId: string) {
    const { data: linkedQuestions, error: linkedError } = await supabaseAdmin
        .from('pdf_questions')
        .select('quiz_id')
        .eq('document_id', documentId);

    if (linkedError) throw new Error(linkedError.message);

    const quizIds = (linkedQuestions ?? [])
        .map((question) => question.quiz_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0);

    if (quizIds.length > 0) {
        const { error: quizError } = await supabaseAdmin
            .from('quizzes')
            .update({ deleted_at: new Date().toISOString() })
            .in('id', quizIds);
        if (quizError) throw new Error(quizError.message);
    }

    const { error: deleteError } = await supabaseAdmin
        .from('pdf_questions')
        .delete()
        .eq('document_id', documentId);

    if (deleteError) throw new Error(deleteError.message);
}

async function processPdfDocument(documentId: string, fileUrl: string) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);
        const response = await fetch(fileUrl, { signal: controller.signal }).finally(() => clearTimeout(timeout));

        if (!response.ok) throw new Error('Failed to fetch PDF (HTTP ' + response.status + ')');

        const contentLength = Number(response.headers.get('content-length') ?? '0');
        if (Number.isFinite(contentLength) && contentLength > 12 * 1024 * 1024) {
            throw new Error('PDF is too large');
        }

        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        const parser = new PDFParse({ data: uint8Array });
        const textResult = await withTimeout(parser.getText(), 45000, 'PDF parsing');
        const textContent = typeof textResult.text === 'string' ? textResult.text : String(textResult.text ?? '');
        await parser.destroy();

        if (!textContent.trim()) {
            throw new Error('No text found in PDF');
        }

        const prompt = `You are a Vietnamese educational assistant for primary school children.
Read the following text extracted from a PDF and generate exactly 3 multiple-choice questions.
Return ONLY a JSON array where each object has:
- "question" (string)
- "options" (array of exactly 4 strings)
- "correctIndex" (integer 0-3, the index of the correct option in the options array)

Important requirements:
- All question text and all options MUST be in Vietnamese.
- Language style must be simple, natural, and suitable for children.
- Do not include English unless it already appears as a required term in the source.
- You must generate exactly 3 questions.

Text:
${textContent.substring(0, 100000)}
`;

        const aiResponse = await generateWithFallback(prompt);

        const questionsList = parseAIResponse(aiResponse.text ?? '');
        const inserts = questionsList.map((q) => ({
            document_id: documentId,
            question: q.question,
            options: q.options,
            correct_index: q.correctIndex,
            status: 'pending' as QuestionStatus
        }));

        const { error: insertError } = await supabaseAdmin.from('pdf_questions').insert(inserts);
        if (insertError) {
            throw new Error('Failed to save generated questions');
        }

        await supabaseAdmin
            .from('pdf_documents')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', documentId);
    } catch (error: any) {
        console.error('AI Processing Error:', { documentId, fileUrl, error });
        await supabaseAdmin
            .from('pdf_documents')
            .update({ status: 'error', updated_at: new Date().toISOString() })
            .eq('id', documentId);
    }
}

async function syncApprovedQuestionToLessonQuiz(questionId: string) {
    const { data: row, error } = await supabaseAdmin
        .from('pdf_questions')
        .select('id, document_id, question, options, correct_index, status, quiz_id, pdf_documents(lesson_id)')
        .eq('id', questionId)
        .single();

    if (error || !row) throw new Error(error?.message ?? 'Question not found');

    const documentRef = Array.isArray(row.pdf_documents) ? row.pdf_documents[0] : row.pdf_documents;
    const lessonId = documentRef?.lesson_id;

    if (!lessonId) return row;

    if (row.status !== 'approved') {
        if (row.quiz_id) {
            await supabaseAdmin
                .from('quizzes')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', row.quiz_id);
        }
        return row;
    }

    if (row.quiz_id) {
        const { error: updateError } = await supabaseAdmin
            .from('quizzes')
            .update({
                lesson_id: lessonId,
                question: row.question,
                options: row.options,
                correct_index: row.correct_index,
                source_type: 'ai_pdf',
                source_pdf_question_id: row.id,
                deleted_at: null,
            })
            .eq('id', row.quiz_id);
        if (updateError) throw new Error(updateError.message);
        return row;
    }

    const { data: createdQuiz, error: insertError } = await supabaseAdmin
        .from('quizzes')
        .insert({
            lesson_id: lessonId,
            question: row.question,
            options: row.options,
            correct_index: row.correct_index,
            source_type: 'ai_pdf',
            source_pdf_question_id: row.id,
        })
        .select('id')
        .single();

    if (insertError || !createdQuiz) throw new Error(insertError?.message ?? 'Failed to sync AI question');

    const { error: linkError } = await supabaseAdmin
        .from('pdf_questions')
        .update({ quiz_id: createdQuiz.id })
        .eq('id', row.id);

    if (linkError) throw new Error(linkError.message);

    return { ...row, quiz_id: createdQuiz.id };
}
// POST /ai-quiz/upload
router.post('/upload', authenticate, requireRole('parent'), validate(uploadSchema), async (req, res) => {
    const { title, fileUrl, filePath } = req.body;
    const parentId = req.user!.id;

    if (!isAllowedFileUrl(fileUrl)) {
        res.status(400).json({ error: 'Invalid file URL' });
        return;
    }

    const { data: doc, error: docError } = await supabaseAdmin.from('pdf_documents')
        .insert({ parent_id: parentId, lesson_id: null, title, file_url: fileUrl, file_path: filePath ?? null, status: 'processing' })
        .select().single();

    if (docError || !doc) {
        res.status(500).json({ error: 'Failed to create document record' });
        return;
    }

    res.status(202).json({ documentId: doc.id, message: 'Processing started' });
    void processPdfDocument(doc.id, fileUrl);
});

// PATCH /ai-quiz/documents/:id
router.patch('/documents/:id', authenticate, requireRole('parent'), validate(updateDocumentSchema), async (req, res) => {
    const documentId = getParamId(req.params.id);
    const parentId = req.user!.id;
    const { title } = req.body;

    const owned = await isDocumentOwnedByParent(documentId, parentId);
    if (!owned) {
        res.status(403).json({ error: 'Access denied to this document' });
        return;
    }

    const { data, error } = await supabaseAdmin
        .from('pdf_documents')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', documentId)
        .eq('parent_id', parentId)
        .select()
        .single();

    if (error || !data) {
        res.status(500).json({ error: error?.message ?? 'Failed to update document' });
        return;
    }

    res.json(data);
});

// POST /ai-quiz/documents/:id/replace-file
router.post('/documents/:id/replace-file', authenticate, requireRole('parent'), validate(replaceDocumentFileSchema), async (req, res) => {
    const documentId = getParamId(req.params.id);
    const parentId = req.user!.id;
    const { fileUrl, filePath } = req.body;

    if (!isAllowedFileUrl(fileUrl)) {
        res.status(400).json({ error: 'Invalid file URL' });
        return;
    }

    const owned = await isDocumentOwnedByParent(documentId, parentId);
    if (!owned) {
        res.status(403).json({ error: 'Access denied to this document' });
        return;
    }

    try {
        const completedCount = await getCompletedAssignmentCount(documentId, parentId);
        if (completedCount > 0) {
            res.status(409).json({ error: 'Cannot replace a PDF after a child has completed this assignment' });
            return;
        }

        const { data: currentDocument, error: currentDocumentError } = await supabaseAdmin
            .from('pdf_documents')
            .select('version')
            .eq('id', documentId)
            .eq('parent_id', parentId)
            .single();

        if (currentDocumentError || !currentDocument) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }

        await deleteQuestionsForRegeneration(documentId);

        const { data, error } = await supabaseAdmin
            .from('pdf_documents')
            .update({
                file_url: fileUrl,
                file_path: filePath ?? null,
                status: 'processing',
                version: (currentDocument.version ?? 1) + 1,
                updated_at: new Date().toISOString(),
            })
            .eq('id', documentId)
            .eq('parent_id', parentId)
            .select()
            .single();

        if (error || !data) {
            res.status(500).json({ error: error?.message ?? 'Failed to replace PDF' });
            return;
        }

        res.status(202).json({ document: data, message: 'Reprocessing started' });
        void processPdfDocument(documentId, fileUrl);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to replace PDF' });
    }
});

// DELETE /ai-quiz/documents/:id
router.delete('/documents/:id', authenticate, requireRole('parent'), async (req, res) => {
    const documentId = getParamId(req.params.id);
    const parentId = req.user!.id;

    const { data: document, error: documentError } = await supabaseAdmin
        .from('pdf_documents')
        .select('id, parent_id, file_path')
        .eq('id', documentId)
        .eq('parent_id', parentId)
        .maybeSingle();

    if (documentError || !document) {
        res.status(404).json({ error: 'Document not found' });
        return;
    }

    try {
        const completedCount = await getCompletedAssignmentCount(documentId, parentId);
        if (completedCount > 0) {
            res.status(409).json({ error: 'Cannot delete a document after a child has completed an assignment' });
            return;
        }

        const activeAssignmentCount = await getActiveAssignmentCount(documentId, parentId);

        if (activeAssignmentCount > 0) {
            const { error: cancelError } = await supabaseAdmin
                .from('assigned_ai_quizzes')
                .update({ status: 'cancelled' })
                .eq('document_id', documentId)
                .eq('parent_id', parentId)
                .neq('status', 'completed');

            if (cancelError) throw new Error(cancelError.message);
        }

        await deleteQuestionsForRegeneration(documentId);

        const { error: deleteDocumentError } = await supabaseAdmin
            .from('pdf_documents')
            .delete()
            .eq('id', documentId)
            .eq('parent_id', parentId);

        if (deleteDocumentError) throw new Error(deleteDocumentError.message);

        if (document.file_path) {
            const { error: storageError } = await supabaseAdmin.storage
                .from('pdfs')
                .remove([document.file_path]);

            if (storageError) {
                console.warn('[ai-quiz] failed to delete PDF storage object', { documentId, filePath: document.file_path, error: storageError });
            }
        }

        res.json({ success: true, cancelledAssignments: activeAssignmentCount });
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to delete document' });
    }
});

// GET /ai-quiz/documents/:id/questions
router.get('/documents/:id/questions', authenticate, requireRole('parent'), async (req, res) => {
    const documentId = getParamId(req.params.id);

    const owned = await isDocumentOwnedByParent(documentId, req.user!.id);
    if (!owned) {
        res.status(403).json({ error: 'Access denied to this document' });
        return;
    }

    const { data, error } = await supabaseAdmin.from('pdf_questions')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at');

    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    res.json(data);
});

// POST /ai-quiz/documents/:id/questions
router.post('/documents/:id/questions', authenticate, requireRole('parent'), validate(createManualQuestionSchema), async (req, res) => {
    const documentId = getParamId(req.params.id);
    const { question, options, correctIndex, status } = req.body;

    const owned = await isDocumentOwnedByParent(documentId, req.user!.id);
    if (!owned) {
        res.status(403).json({ error: 'Access denied to this document' });
        return;
    }

    const { data, error } = await supabaseAdmin
        .from('pdf_questions')
        .insert({
            document_id: documentId,
            question,
            options,
            correct_index: correctIndex,
            status,
        })
        .select()
        .single();

    if (error || !data) {
        res.status(500).json({ error: error?.message ?? 'Failed to create question' });
        return;
    }

    if (data.status === 'approved') {
        try {
            await syncApprovedQuestionToLessonQuiz(data.id);
        } catch (syncError) {
            res.status(500).json({ error: syncError instanceof Error ? syncError.message : 'Failed to sync lesson quiz' });
            return;
        }
    }

    res.status(201).json(data);
});

// PUT /ai-quiz/questions/:id/status
router.put('/questions/:id/status', authenticate, requireRole('parent'), validate(updateStatusSchema), async (req, res) => {
    const questionId = getParamId(req.params.id);
    const { status } = req.body;

    const ownedQuestion = await getOwnedQuestion(questionId, req.user!.id);
    if (!ownedQuestion) {
        res.status(404).json({ error: 'Question not found or no permission' });
        return;
    }

    const { data, error } = await supabaseAdmin.from('pdf_questions')
        .update({ status })
        .eq('id', questionId)
        .select().single();

    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }

    try {
        await syncApprovedQuestionToLessonQuiz(questionId);
    } catch (syncError) {
        res.status(500).json({ error: syncError instanceof Error ? syncError.message : 'Failed to sync lesson quiz' });
        return;
    }

    res.json(data);
});

// PUT /ai-quiz/questions/:id
router.put('/questions/:id', authenticate, requireRole('parent'), validate(updateManualQuestionSchema), async (req, res) => {
    const questionId = getParamId(req.params.id);
    const { question, options, correctIndex, status } = req.body;

    const ownedQuestion = await getOwnedQuestion(questionId, req.user!.id);
    if (!ownedQuestion) {
        res.status(404).json({ error: 'Question not found or no permission' });
        return;
    }

    const updatePayload: {
        question: string;
        options: string[];
        correct_index: number;
        status?: QuestionStatus;
    } = {
        question,
        options,
        correct_index: correctIndex,
    };

    if (status) updatePayload.status = status;

    const { data, error } = await supabaseAdmin
        .from('pdf_questions')
        .update(updatePayload)
        .eq('id', questionId)
        .select()
        .single();

    if (error || !data) {
        res.status(500).json({ error: error?.message ?? 'Failed to update question' });
        return;
    }

    try {
        await syncApprovedQuestionToLessonQuiz(questionId);
    } catch (syncError) {
        res.status(500).json({ error: syncError instanceof Error ? syncError.message : 'Failed to sync lesson quiz' });
        return;
    }

    res.json(data);
});

// DELETE /ai-quiz/questions/:id
router.delete('/questions/:id', authenticate, requireRole('parent'), async (req, res) => {
    const questionId = getParamId(req.params.id);

    const ownedQuestion = await getOwnedQuestion(questionId, req.user!.id);
    if (!ownedQuestion) {
        res.status(404).json({ error: 'Question not found or no permission' });
        return;
    }

    const { data: questionToDelete } = await supabaseAdmin
        .from('pdf_questions')
        .select('quiz_id')
        .eq('id', questionId)
        .maybeSingle();

    if (questionToDelete?.quiz_id) {
        const { error: quizError } = await supabaseAdmin
            .from('quizzes')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', questionToDelete.quiz_id);
        if (quizError) {
            res.status(500).json({ error: quizError.message });
            return;
        }
    }

    const { error } = await supabaseAdmin.from('pdf_questions').delete().eq('id', questionId);
    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }

    res.json({ success: true });
});

// GET /ai-quiz/documents
router.get('/documents', authenticate, requireRole('parent'), async (req, res) => {
    const parentId = req.user!.id;
    const { data, error } = await supabaseAdmin.from('pdf_documents')
        .select('*')
        .eq('parent_id', parentId)
        .order('created_at', { ascending: false });

    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    res.json(data);
});

// GET /ai-quiz/documents/:id
router.get('/documents/:id', authenticate, requireRole('parent', 'child'), async (req, res) => {
    const documentId = getParamId(req.params.id);

    const hasAccess = req.user!.role === 'parent'
        ? await isDocumentOwnedByParent(documentId, req.user!.id)
        : await isDocumentAssignedToChild(documentId, req.user!.id);

    if (!hasAccess) {
        res.status(403).json({ error: 'Access denied to this document' });
        return;
    }

    const { data, error } = await supabaseAdmin.from('pdf_documents')
        .select('*')
        .eq('id', documentId)
        .single();

    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    res.json(data);
});

// GET /ai-quiz/documents/:id/playable
router.get('/documents/:id/playable', authenticate, requireRole('child', 'parent'), async (req, res) => {
    const documentId = getParamId(req.params.id);

    const { data: doc, error: docError } = await supabaseAdmin
        .from('pdf_documents')
        .select('id, title, file_url, parent_id')
        .eq('id', documentId)
        .single();

    if (docError || !doc) {
        res.status(404).json({ error: 'Document not found' });
        return;
    }

    if (req.user!.role === 'parent' && doc.parent_id !== req.user!.id) {
        res.status(403).json({ error: 'Access denied to this document' });
        return;
    }

    if (req.user!.role === 'child') {
        const { data: assignment, error: assignmentError } = await supabaseAdmin
            .from('assigned_ai_quizzes')
            .select('id')
            .eq('document_id', documentId)
            .eq('child_id', req.user!.id)
            .neq('status', 'cancelled')
            .maybeSingle();

        if (assignmentError || !assignment) {
            res.status(403).json({ error: 'Access denied to this document' });
            return;
        }
    }

    const { data: questions, error: questionError } = await supabaseAdmin
        .from('pdf_questions')
        .select('id, question, options, correct_index')
        .eq('document_id', documentId)
        .eq('status', 'approved')
        .order('created_at');

    if (questionError) {
        res.status(500).json({ error: questionError.message });
        return;
    }

    res.json({ document: { id: doc.id, title: doc.title, file_url: doc.file_url }, questions: questions ?? [] });
});

export default router;
