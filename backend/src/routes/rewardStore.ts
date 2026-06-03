import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

/**
 * GET /reward-store
 * Query params:
 *   - parentId  → lấy tất cả quà của parent (trang quản lý ba/mẹ)
 *   - childId   → lấy quà của parent_id tương ứng với bé (trang bé)
 */
router.get('/', async (req, res) => {
    const { parentId, childId } = req.query;

    if (!parentId && !childId) {
        res.status(400).json({ error: 'Cần truyền parentId hoặc childId' });
        return;
    }

    try {
        let resolvedParentId = parentId as string | undefined;

        // Nếu truyền childId, lấy parent_id từ profile của bé
        if (childId && !parentId) {
            const { data: profile, error: profileErr } = await supabaseAdmin
                .from('profiles')
                .select('parent_id')
                .eq('id', String(childId))
                .single();

            if (profileErr || !profile?.parent_id) {
                res.status(404).json({ error: 'Không tìm thấy thông tin bé hoặc bé chưa liên kết với ba/mẹ' });
                return;
            }
            resolvedParentId = profile.parent_id;
        }

        const { data, error } = await supabaseAdmin
            .from('reward_items')
            .select('*')
            .eq('parent_id', resolvedParentId!)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /reward-store
 * Body: { parentId, title, description?, costPoints }
 * Ba/mẹ tạo quà mới.
 */
router.post('/', async (req, res) => {
    const { parentId, title, description, costPoints } = req.body;

    if (!parentId || !title || !costPoints) {
        res.status(400).json({ error: 'Thiếu trường bắt buộc: parentId, title, costPoints' });
        return;
    }

    const { data, error } = await supabaseAdmin
        .from('reward_items')
        .insert({
            parent_id: parentId,
            title: title.trim(),
            description: description?.trim() || null,
            cost_points: Number(costPoints),
        })
        .select()
        .single();

    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    res.status(201).json(data);
});

/**
 * PATCH /reward-store/:id
 * Body: { parentId, isActive }
 * Ba/mẹ ẩn/hiện quà.
 */
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { parentId, isActive } = req.body;

    if (!parentId) {
        res.status(400).json({ error: 'Thiếu parentId' });
        return;
    }

    const { data, error } = await supabaseAdmin
        .from('reward_items')
        .update({ is_active: Boolean(isActive) })
        .eq('id', id)
        .eq('parent_id', parentId)
        .is('deleted_at', null)
        .select()
        .single();

    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    if (!data) {
        res.status(404).json({ error: 'Không tìm thấy phần thưởng hoặc bạn không có quyền' });
        return;
    }
    res.json(data);
});

/**
 * DELETE /reward-store/:id
 * Body: { parentId }
 * Ba/mẹ xóa quà (soft delete).
 */
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { parentId } = req.body;

    if (!parentId) {
        res.status(400).json({ error: 'Thiếu parentId' });
        return;
    }

    const { error } = await supabaseAdmin
        .from('reward_items')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('parent_id', parentId);

    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    res.json({ success: true });
});

/**
 * POST /reward-store/:id/redeem
 * Body: { childId }
 * Bé đổi quà: kiểm tra XP, trừ XP, tạo redemption với status='requested'.
 */
router.post('/:id/redeem', async (req, res) => {
    const { id } = req.params;
    const { childId } = req.body;

    if (!childId) {
        res.status(400).json({ error: 'Thiếu childId' });
        return;
    }

    try {
        // 1. Lấy thông tin phần thưởng
        const { data: item, error: itemErr } = await supabaseAdmin
            .from('reward_items')
            .select('id, parent_id, title, cost_points, is_active, deleted_at')
            .eq('id', id)
            .single();

        if (itemErr || !item) {
            res.status(404).json({ error: 'Không tìm thấy phần thưởng' });
            return;
        }
        if (!item.is_active || item.deleted_at) {
            res.status(400).json({ error: 'Phần thưởng này hiện không khả dụng' });
            return;
        }

        // 2. Lấy XP hiện tại của bé
        const { data: profile, error: profileErr } = await supabaseAdmin
            .from('profiles')
            .select('xp')
            .eq('id', childId)
            .single();

        if (profileErr || !profile) {
            res.status(404).json({ error: 'Không tìm thấy hồ sơ bé' });
            return;
        }

        if ((profile.xp ?? 0) < item.cost_points) {
            res.status(400).json({ error: 'Không đủ XP để đổi phần thưởng này' });
            return;
        }

        // 3. Trừ XP
        const newXp = (profile.xp ?? 0) - item.cost_points;
        const { error: xpErr } = await supabaseAdmin
            .from('profiles')
            .update({ xp: newXp })
            .eq('id', childId);

        if (xpErr) throw xpErr;

        // 4. Tạo redemption
        const { error: redemptionErr } = await supabaseAdmin
            .from('reward_redemptions')
            .insert({
                reward_item_id: item.id,
                child_id: childId,
                parent_id: item.parent_id,
                title: item.title,
                cost_points: item.cost_points,
                status: 'requested',
            });

        if (redemptionErr) throw redemptionErr;

        res.json({ xp: newXp });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
