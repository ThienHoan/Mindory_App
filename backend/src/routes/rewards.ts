import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// =========================================================
// REWARD STORE  (reward_items table)
// =========================================================

/**
 * GET /reward-store
 * Query params:
 *   - parentId  → lấy tất cả quà của parent (trang quản lý ba/mẹ)
 *   - childId   → lấy quà của parent_id tương ứng với bé (trang bé)
 */
router.get('/reward-store', async (req, res) => {
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

        let query = supabaseAdmin
            .from('reward_items')
            .select('*')
            .eq('parent_id', resolvedParentId!)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        const { data, error } = await query;

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
router.post('/reward-store', async (req, res) => {
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
router.patch('/reward-store/:id', async (req, res) => {
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
router.delete('/reward-store/:id', async (req, res) => {
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
router.post('/reward-store/:id/redeem', async (req, res) => {
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

// =========================================================
// REWARD REDEMPTIONS  (reward_redemptions table)
// =========================================================

/**
 * GET /reward-redemptions
 * Query params:
 *   - childId   → lịch sử đổi quà của bé
 *   - parentId  → tất cả yêu cầu đổi quà dưới quyền parent
 */
router.get('/reward-redemptions', async (req, res) => {
    const { childId, parentId } = req.query;

    if (!childId && !parentId) {
        res.status(400).json({ error: 'Cần truyền childId hoặc parentId' });
        return;
    }

    try {
        let query = supabaseAdmin
            .from('reward_redemptions')
            .select('*, profiles!reward_redemptions_child_id_fkey(full_name)')
            .order('requested_at', { ascending: false });

        if (childId) {
            query = query.eq('child_id', String(childId));
        } else {
            query = query.eq('parent_id', String(parentId));
        }

        const { data, error } = await query;

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
 * PATCH /reward-redemptions/:id
 * Body: { parentId, status: 'approved' | 'fulfilled' | 'rejected' }
 * Ba/mẹ duyệt hoặc từ chối yêu cầu đổi quà.
 */
router.patch('/reward-redemptions/:id', async (req, res) => {
    const { id } = req.params;
    const { parentId, status } = req.body;

    if (!parentId || !status) {
        res.status(400).json({ error: 'Thiếu parentId hoặc status' });
        return;
    }
    if (!['approved', 'fulfilled', 'rejected'].includes(status)) {
        res.status(400).json({ error: 'status không hợp lệ' });
        return;
    }

    try {
        // Kiểm tra redemption thuộc parent này
        const { data: existing, error: findErr } = await supabaseAdmin
            .from('reward_redemptions')
            .select('id, status, child_id, cost_points')
            .eq('id', id)
            .eq('parent_id', parentId)
            .single();

        if (findErr || !existing) {
            res.status(404).json({ error: 'Không tìm thấy yêu cầu đổi quà' });
            return;
        }

        // Nếu rejected: hoàn lại XP cho bé
        const allowedTransitions: Record<string, string[]> = {
            requested: ['approved', 'rejected'],
            approved: ['fulfilled', 'rejected'],
            fulfilled: [],
            rejected: [],
        };

        if (!allowedTransitions[existing.status]?.includes(status)) {
            res.status(400).json({ error: 'KhÃ´ng thá»ƒ chuyá»ƒn tráº¡ng thÃ¡i yÃªu cáº§u Ä‘á»•i quÃ  nhÆ° váº­y' });
            return;
        }

        if (status === 'rejected' && existing.status !== 'rejected') {
            const { data: childProfile } = await supabaseAdmin
                .from('profiles')
                .select('xp')
                .eq('id', existing.child_id)
                .single();

            if (childProfile) {
                await supabaseAdmin
                    .from('profiles')
                    .update({ xp: (childProfile.xp ?? 0) + existing.cost_points })
                    .eq('id', existing.child_id);
            }
        }

        const { data, error } = await supabaseAdmin
            .from('reward_redemptions')
            .update({
                status,
                resolved_at: ['approved', 'fulfilled', 'rejected'].includes(status)
                    ? new Date().toISOString()
                    : null,
            })
            .eq('id', id)
            .select('*, profiles!reward_redemptions_child_id_fkey(full_name)')
            .single();

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
 * PATCH /reward-redemptions/:id/fulfill
 * Body: { childId }
 * Bé xác nhận đã nhận quà → status = 'fulfilled'.
 */
router.patch('/reward-redemptions/:id/fulfill', async (req, res) => {
    const { id } = req.params;
    const { childId } = req.body;

    if (childId) {
        res.status(403).json({ error: 'Chá»‰ ba/máº¹ má»›i cÃ³ thá»ƒ xÃ¡c nháº­n Ä‘Ã£ trao quÃ ' });
        return;
    }

    if (!childId) {
        res.status(400).json({ error: 'Thiếu childId' });
        return;
    }

    try {
        const { data: existing, error: findErr } = await supabaseAdmin
            .from('reward_redemptions')
            .select('id, status, child_id')
            .eq('id', id)
            .eq('child_id', childId)
            .single();

        if (findErr || !existing) {
            res.status(404).json({ error: 'Không tìm thấy yêu cầu đổi quà' });
            return;
        }
        if (existing.status !== 'approved') {
            res.status(400).json({ error: 'Chỉ có thể xác nhận khi quà đã được ba/mẹ duyệt' });
            return;
        }

        const { data, error } = await supabaseAdmin
            .from('reward_redemptions')
            .update({ status: 'fulfilled', resolved_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
