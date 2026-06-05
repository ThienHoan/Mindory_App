import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';

const router = Router();

const createAssignmentSchema = z.object({
    documentId: z.string().uuid(),
    childId: z.string().uuid(),
});

const completeAssignmentSchema = z.object({
    status: z.literal('completed'),
});

const cancelAssignmentSchema = z.object({
    status: z.literal('cancelled').optional(),
});

// POST /ai-assignments
router.post('/', authenticate, requireRole('parent'), validate(createAssignmentSchema), async (req, res) => {
    const { documentId, childId } = req.body;
    const parentId = req.user!.id;

    const { data: doc, error: docError } = await supabaseAdmin
        .from('pdf_documents')
        .select('id, parent_id')
        .eq('id', documentId)
        .single();

    if (docError || !doc) {
        res.status(404).json({ error: 'Document not found' });
        return;
    }

    if (doc.parent_id !== parentId) {
        res.status(403).json({ error: 'Access denied to this document' });
        return;
    }

    const { data: child, error: childError } = await supabaseAdmin
        .from('profiles')
        .select('id, parent_id, role')
        .eq('id', childId)
        .single();

    if (childError || !child) {
        res.status(404).json({ error: 'Child not found' });
        return;
    }

    if (child.role !== 'child' || child.parent_id !== parentId) {
        res.status(403).json({ error: 'Child does not belong to this parent' });
        return;
    }

    const { data: existing } = await supabaseAdmin
        .from('assigned_ai_quizzes')
        .select('*')
        .eq('parent_id', parentId)
        .eq('child_id', childId)
        .eq('document_id', documentId)
        .maybeSingle();

    if (existing) {
        if (existing.status === 'cancelled') {
            const { data: reactivated, error: reactivateError } = await supabaseAdmin
                .from('assigned_ai_quizzes')
                .update({ status: 'assigned', assigned_at: new Date().toISOString(), completed_at: null })
                .eq('id', existing.id)
                .select('*')
                .single();

            if (reactivateError || !reactivated) {
                res.status(500).json({ error: reactivateError?.message ?? 'Failed to assign quiz' });
                return;
            }

            res.json(reactivated);
            return;
        }

        res.json(existing);
        return;
    }

    const { data, error } = await supabaseAdmin
        .from('assigned_ai_quizzes')
        .insert({ parent_id: parentId, child_id: childId, document_id: documentId })
        .select('*')
        .single();

    if (error || !data) {
        res.status(500).json({ error: error?.message ?? 'Failed to assign quiz' });
        return;
    }

    res.status(201).json(data);
});

// GET /ai-assignments
router.get('/', authenticate, requireRole('parent'), async (req, res) => {
    const parentId = req.user!.id;
    const documentId = typeof req.query.documentId === 'string' ? req.query.documentId : undefined;
    const childId = typeof req.query.childId === 'string' ? req.query.childId : undefined;

    let query = supabaseAdmin
        .from('assigned_ai_quizzes')
        .select('*, pdf_documents(id, title), profiles!assigned_ai_quizzes_child_id_fkey(id, full_name, email)')
        .eq('parent_id', parentId)
        .order('assigned_at', { ascending: false });

    if (documentId) query = query.eq('document_id', documentId);
    if (childId) query = query.eq('child_id', childId);

    const { data, error } = await query;

    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }

    res.json(data ?? []);
});

// GET /ai-assignments/mine
router.get('/mine', authenticate, requireRole('child'), async (req, res) => {
    const childId = req.user!.id;

    const { data: assignments, error } = await supabaseAdmin
        .from('assigned_ai_quizzes')
        .select('*, profiles!assigned_ai_quizzes_parent_id_fkey(id, full_name, email)')
        .eq('child_id', childId)
        .neq('status', 'cancelled')
        .order('assigned_at', { ascending: false });

    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }

    const documentIds = Array.from(new Set((assignments ?? []).map((assignment) => assignment.document_id).filter(Boolean)));
    let documentsById = new Map<string, { id: string; title: string; file_url: string; created_at: string }>();

    if (documentIds.length > 0) {
        const { data: documents, error: documentsError } = await supabaseAdmin
            .from('pdf_documents')
            .select('id, title, file_url, created_at')
            .in('id', documentIds);

        if (documentsError) {
            res.status(500).json({ error: documentsError.message });
            return;
        }

        documentsById = new Map((documents ?? []).map((document) => [document.id, document]));
    }

    res.json((assignments ?? []).map((assignment) => {
        const document = documentsById.get(assignment.document_id) ?? null;
        return {
            ...assignment,
            pdf_documents: document,
            document,
            documentTitle: document?.title ?? null,
            pdfUrl: document?.file_url ?? null,
        };
    }));
});

// PATCH /ai-assignments/:id/complete
router.patch('/:id/complete', authenticate, requireRole('child'), validate(completeAssignmentSchema), async (req, res) => {
    const assignmentId = req.params.id;
    const childId = req.user!.id;

    const { data: assignment, error: findError } = await supabaseAdmin
        .from('assigned_ai_quizzes')
        .select('id, status')
        .eq('id', assignmentId)
        .eq('child_id', childId)
        .maybeSingle();

    if (findError || !assignment) {
        res.status(404).json({ error: 'Assignment not found' });
        return;
    }

    if (assignment.status === 'completed') {
        res.json({ ...assignment, xpAwarded: 0, xp: null });
        return;
    }

    if (assignment.status === 'cancelled') {
        res.status(409).json({ error: 'Assignment has been cancelled' });
        return;
    }

    const { data, error } = await supabaseAdmin
        .from('assigned_ai_quizzes')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', assignmentId)
        .select('*')
        .single();

    if (error || !data) {
        res.status(500).json({ error: error?.message ?? 'Failed to update assignment' });
        return;
    }

    // Grant XP to the child for completing the AI assignment
    const xpAwarded = 10;
    let nextXp: number | null = null;
    const { data: profile } = await supabaseAdmin.from('profiles').select('xp').eq('id', childId).single();
    if (profile) {
        nextXp = (profile.xp || 0) + xpAwarded;
        await supabaseAdmin.from('profiles').update({ xp: nextXp }).eq('id', childId);
    }

    res.json({ ...data, xpAwarded, xp: nextXp });
});

// PATCH /ai-assignments/:id/cancel
router.patch('/:id/cancel', authenticate, requireRole('parent'), validate(cancelAssignmentSchema), async (req, res) => {
    const assignmentId = req.params.id;
    const parentId = req.user!.id;

    const { data: assignment, error: findError } = await supabaseAdmin
        .from('assigned_ai_quizzes')
        .select('*')
        .eq('id', assignmentId)
        .eq('parent_id', parentId)
        .maybeSingle();

    if (findError || !assignment) {
        res.status(404).json({ error: 'Assignment not found' });
        return;
    }

    if (assignment.status === 'completed') {
        res.status(409).json({ error: 'Cannot cancel a completed assignment' });
        return;
    }

    if (assignment.status === 'cancelled') {
        res.json(assignment);
        return;
    }

    const { data, error } = await supabaseAdmin
        .from('assigned_ai_quizzes')
        .update({ status: 'cancelled' })
        .eq('id', assignmentId)
        .eq('parent_id', parentId)
        .select('*')
        .single();

    if (error || !data) {
        res.status(500).json({ error: error?.message ?? 'Failed to cancel assignment' });
        return;
    }

    res.json(data);
});

export default router;
