import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /auth/me — Lấy thông tin người dùng đang login
router.get('/me', authenticate, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('id, email, full_name, role, parent_id, avatar_url, created_at')
            .eq('id', req.user!.id)
            .single();

        if (error || !data) {
            res.status(404).json({ error: 'Profile not found' });
            return;
        }

        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /auth/profile — Cập nhật thông tin cá nhân (Zod validated)
const updateProfileSchema = z.object({
    fullName: z.string().min(1).max(100).optional(),
    avatarUrl: z.string().url('Invalid avatar URL').optional(),
});

router.patch('/profile', authenticate, async (req, res) => {
    const parseResult = updateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.flatten().fieldErrors });
        return;
    }

    const { fullName, avatarUrl } = parseResult.data;

    // Only update fields that were provided
    const updatePayload: Record<string, any> = {};
    if (fullName !== undefined) updatePayload.full_name = fullName;
    if (avatarUrl !== undefined) updatePayload.avatar_url = avatarUrl;

    if (Object.keys(updatePayload).length === 0) {
        res.status(400).json({ error: 'No fields to update' });
        return;
    }

    const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(updatePayload)
        .eq('id', req.user!.id)
        .select()
        .single();

    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }

    res.json(data);
});

export default router;
