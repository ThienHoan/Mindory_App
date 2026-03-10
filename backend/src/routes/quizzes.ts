import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();

const createQuizSchema = z.object({
    lessonId: z.string().uuid(),
    question: z.string().min(1),
    options: z.array(z.string()).length(4, 'Must have exactly 4 options'),
    correctIndex: z.number().int().min(0).max(3),
});
const updateQuizSchema = z.object({
    question: z.string().min(1).optional(),
    options: z.array(z.string()).length(4).optional(),
    correctIndex: z.number().int().min(0).max(3).optional(),
}).refine(d => d.question || d.options || d.correctIndex !== undefined, { message: 'At least one field required' });

// GET /quizzes?lessonId=...
router.get('/', async (req, res) => {
    const { lessonId } = req.query;
    if (!lessonId) { res.status(400).json({ error: 'Missing required query param: lessonId' }); return; }

    const { data, error } = await supabaseAdmin.from('quizzes')
        .select('id, question, options, correct_index')
        .eq('lesson_id', String(lessonId)).is('deleted_at', null).order('created_at');
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
});

// POST /quizzes — Admin
router.post('/', authenticate, requireRole('admin'), validate(createQuizSchema), async (req, res) => {
    const { lessonId, question, options, correctIndex } = req.body;
    const { data, error } = await supabaseAdmin.from('quizzes')
        .insert({ lesson_id: lessonId, question, options, correct_index: correctIndex }).select().single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(201).json(data);
});

// PUT /quizzes/:id — Admin
router.put('/:id', authenticate, requireRole('admin'), validate(updateQuizSchema), async (req, res) => {
    const { data: quiz } = await supabaseAdmin.from('quizzes').select('id')
        .eq('id', req.params.id).is('deleted_at', null).single();
    if (!quiz) { res.status(404).json({ error: 'Quiz not found' }); return; }

    const payload: Record<string, any> = {};
    if (req.body.question) payload.question = req.body.question;
    if (req.body.options) payload.options = req.body.options;
    if (req.body.correctIndex !== undefined) payload.correct_index = req.body.correctIndex;

    const { data, error } = await supabaseAdmin.from('quizzes').update(payload)
        .eq('id', req.params.id).select().single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
});

// DELETE /quizzes/:id — Admin (Soft)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
    const { data: quiz } = await supabaseAdmin.from('quizzes').select('id')
        .eq('id', req.params.id).is('deleted_at', null).single();
    if (!quiz) { res.status(404).json({ error: 'Quiz not found' }); return; }

    const { error } = await supabaseAdmin.from('quizzes')
        .update({ deleted_at: new Date().toISOString() }).eq('id', req.params.id);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true });
});

export default router;
