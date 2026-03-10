import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { validate } from '../middleware/validate';

const router = Router();

const createChildSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(1).max(100),
    parentId: z.string().uuid(),
});

const updateChildSchema = z.object({
    parentId: z.string().uuid(),
    fullName: z.string().min(1).max(100).optional(),
    avatarUrl: z.string().url('Invalid URL').optional(),
}).refine(d => d.fullName || d.avatarUrl, { message: 'At least one field to update required' });

const deleteChildSchema = z.object({ parentId: z.string().uuid() });

// POST /children
router.post('/', validate(createChildSchema), async (req, res) => {
    const { email, password, fullName, parentId } = req.body;
    try {
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email, password, email_confirm: true,
            user_metadata: { full_name: fullName, role: 'child', parent_id: parentId }
        });
        if (createError) throw createError;
        if (!newUser.user) throw new Error('Failed to create user');

        await supabaseAdmin.from('profiles')
            .update({ role: 'child', parent_id: parentId })
            .eq('id', newUser.user.id);

        res.json({ success: true, user: newUser.user });
    } catch (error: any) { res.status(400).json({ error: error.message }); }
});

// GET /children?parentId=...
router.get('/', async (req, res) => {
    const { parentId, page, limit } = req.query;
    if (!parentId) { res.status(400).json({ error: 'Missing parentId' }); return; }
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
    const from = (pageNum - 1) * limitNum;

    const { data, error, count } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, role, avatar_url, created_at', { count: 'exact' })
        .eq('parent_id', String(parentId)).eq('role', 'child')
        .is('deleted_at', null)
        .order('created_at').range(from, from + limitNum - 1);

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data, total: count });
});

// PATCH /children/:id — Sửa thông tin bé
router.patch('/:id', validate(updateChildSchema), async (req, res) => {
    const { id } = req.params;
    const { parentId, fullName, avatarUrl } = req.body;

    // Ownership + not deleted check
    const { data: child } = await supabaseAdmin
        .from('profiles').select('id')
        .eq('id', id).eq('parent_id', parentId).eq('role', 'child').is('deleted_at', null).single();
    if (!child) { res.status(403).json({ error: 'Child not found or you do not have permission' }); return; }

    const updatePayload: Record<string, any> = {};
    if (fullName) updatePayload.full_name = fullName;
    if (avatarUrl) updatePayload.avatar_url = avatarUrl;

    const { data, error } = await supabaseAdmin
        .from('profiles').update(updatePayload).eq('id', id).select().single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
});

// DELETE /children/:id — Soft delete
router.delete('/:id', validate(deleteChildSchema), async (req, res) => {
    const { id } = req.params;
    const { parentId } = req.body;

    const { data: child } = await supabaseAdmin
        .from('profiles').select('id')
        .eq('id', id).eq('parent_id', parentId).eq('role', 'child').is('deleted_at', null).single();
    if (!child) { res.status(404).json({ error: 'Child not found or already deleted' }); return; }

    const { error } = await supabaseAdmin
        .from('profiles').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true, message: 'Child profile soft-deleted successfully' });
});

// PATCH /children/:id/restore — Restore soft-deleted child
router.patch('/:id/restore', async (req, res) => {
    const { id } = req.params;
    const { parentId } = req.body;
    if (!parentId) { res.status(400).json({ error: 'Missing required field: parentId' }); return; }

    const { data: child } = await supabaseAdmin
        .from('profiles').select('id')
        .eq('id', id).eq('parent_id', parentId).eq('role', 'child').not('deleted_at', 'is', null).single();
    if (!child) { res.status(404).json({ error: 'Child not found or not deleted' }); return; }

    const { data, error } = await supabaseAdmin
        .from('profiles').update({ deleted_at: null }).eq('id', id).select().single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
});

export default router;
