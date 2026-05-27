import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();

const createSubjectSchema = z.object({
    name: z.string().min(1).max(200),
    grade: z.number().int().min(1).max(5),
});
const updateSubjectSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    grade: z.number().int().min(1).max(5).optional(),
}).refine(d => d.name || d.grade, { message: 'At least one field required' });

// GET /subjects?grade=... — Public (used by Child/Parent to load lessons)
router.get('/', async (req, res) => {
    const { grade } = req.query;
    const pageNum = Math.max(1, Number(req.query.page) || 1);
    const limitNum = Math.min(100, Number(req.query.limit) || 20);
    const from = (pageNum - 1) * limitNum;

    let query = supabaseAdmin.from('subjects').select('*', { count: 'exact' })
        .is('deleted_at', null).order('name');
    if (grade) query = query.eq('grade', Number(grade));

    const { data, error, count } = await query.range(from, from + limitNum - 1);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data, total: count });
});

// GET /subjects/admin/list — Admin only (includes all fields for management UI)
router.get('/admin/list', authenticate, requireRole('admin'), async (req, res) => {
    const { grade } = req.query;
    const pageNum = Math.max(1, Number(req.query.page) || 1);
    const limitNum = Math.min(100, Number(req.query.limit) || 20);
    const from = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
        .from('subjects')
        .select('id, name, grade, created_at, deleted_at', { count: 'exact' })
        .order('name');
    if (grade) query = query.eq('grade', Number(grade));

    const { data, error, count } = await query.range(from, from + limitNum - 1);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data, total: count });
});


// POST /subjects — Admin only
router.post('/', authenticate, requireRole('admin'), validate(createSubjectSchema), async (req, res) => {
    const { data, error } = await supabaseAdmin.from('subjects').insert(req.body).select().single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(201).json(data);
});

// PUT /subjects/:id — Admin only
router.put('/:id', authenticate, requireRole('admin'), validate(updateSubjectSchema), async (req, res) => {
    const { data: subject } = await supabaseAdmin.from('subjects').select('id')
        .eq('id', req.params.id).is('deleted_at', null).single();
    if (!subject) { res.status(404).json({ error: 'Subject not found' }); return; }

    const { data, error } = await supabaseAdmin.from('subjects')
        .update(req.body).eq('id', req.params.id).select().single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
});

// DELETE /subjects/:id — Admin only (Soft delete)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
    const { data: subject } = await supabaseAdmin.from('subjects').select('id')
        .eq('id', req.params.id).is('deleted_at', null).single();
    if (!subject) { res.status(404).json({ error: 'Subject not found' }); return; }

    const { error } = await supabaseAdmin.from('subjects')
        .update({ deleted_at: new Date().toISOString() }).eq('id', req.params.id);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true });
});

export default router;
