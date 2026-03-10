import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();

const createLessonSchema = z.object({
    subjectId: z.string().uuid(),
    title: z.string().min(1),
    description: z.string().optional(),
    pdfUrl: z.string().url(),
    totalPages: z.number().int().min(1).optional().default(1),
});
const updateLessonSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    pdfUrl: z.string().url().optional(),
    totalPages: z.number().int().min(1).optional(),
}).refine(d => d.title || d.description || d.pdfUrl || d.totalPages, { message: 'At least one field required' });

// GET /lessons?subjectId=...
router.get('/', async (req, res) => {
    const { subjectId } = req.query;
    const from = (Math.max(1, Number(req.query.page) || 1) - 1) * Math.min(100, Number(req.query.limit) || 20);
    const to = from + Math.min(100, Number(req.query.limit) || 20) - 1;

    let query = supabaseAdmin.from('lessons').select('*', { count: 'exact' })
        .is('deleted_at', null).order('created_at');
    if (subjectId) query = query.eq('subject_id', String(subjectId));

    const { data, error, count } = await query.range(from, to);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data, total: count });
});

// GET /lessons/:id
router.get('/:id', async (req, res) => {
    const { data, error } = await supabaseAdmin.from('lessons')
        .select('*, subjects(name, grade)').eq('id', req.params.id).is('deleted_at', null).single();
    if (error || !data) { res.status(404).json({ error: 'Lesson not found' }); return; }
    res.json(data);
});

// POST /lessons — Admin
router.post('/', authenticate, requireRole('admin'), validate(createLessonSchema), async (req, res) => {
    const { subjectId, title, description, pdfUrl, totalPages } = req.body;
    const { data, error } = await supabaseAdmin.from('lessons')
        .insert({ subject_id: subjectId, title, description, pdf_url: pdfUrl, total_pages: totalPages })
        .select().single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(201).json(data);
});

// PUT /lessons/:id — Admin
router.put('/:id', authenticate, requireRole('admin'), validate(updateLessonSchema), async (req, res) => {
    const { data: lesson } = await supabaseAdmin.from('lessons').select('id')
        .eq('id', req.params.id).is('deleted_at', null).single();
    if (!lesson) { res.status(404).json({ error: 'Lesson not found' }); return; }

    const payload: Record<string, any> = {};
    if (req.body.title) payload.title = req.body.title;
    if (req.body.description !== undefined) payload.description = req.body.description;
    if (req.body.pdfUrl) payload.pdf_url = req.body.pdfUrl;
    if (req.body.totalPages) payload.total_pages = req.body.totalPages;

    const { data, error } = await supabaseAdmin.from('lessons').update(payload)
        .eq('id', req.params.id).select().single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
});

// DELETE /lessons/:id — Admin (Soft)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
    const { data: lesson } = await supabaseAdmin.from('lessons').select('id')
        .eq('id', req.params.id).is('deleted_at', null).single();
    if (!lesson) { res.status(404).json({ error: 'Lesson not found' }); return; }

    const { error } = await supabaseAdmin.from('lessons')
        .update({ deleted_at: new Date().toISOString() }).eq('id', req.params.id);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true });
});

export default router;
