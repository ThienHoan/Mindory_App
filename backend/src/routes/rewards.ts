import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { authenticate } from '../middleware/auth';

const router = Router();

type RedemptionStatus = 'requested' | 'approved' | 'fulfilled' | 'rejected';

function isAdmin(req: Express.Request) {
    return req.user?.role === 'admin';
}

function ensureParentAccess(req: Express.Request, parentId: unknown) {
    if (typeof parentId !== 'string' || parentId.length === 0) {
        return { ok: false as const, status: 400, error: 'Missing parentId' };
    }

    if (!isAdmin(req) && req.user?.id !== parentId) {
        return { ok: false as const, status: 403, error: 'You cannot manage rewards for this parent' };
    }

    return { ok: true as const, parentId };
}

function ensureChildAccess(req: Express.Request, childId: unknown) {
    if (typeof childId !== 'string' || childId.length === 0) {
        return { ok: false as const, status: 400, error: 'Missing childId' };
    }

    if (!isAdmin(req) && req.user?.role === 'child' && req.user.id !== childId) {
        return { ok: false as const, status: 403, error: 'You cannot redeem rewards for another child' };
    }

    return { ok: true as const, childId };
}

function mapRewardRpcError(message?: string) {
    const text = message ?? 'Reward request failed';
    if (text.includes('reward_not_found') || text.includes('redemption_not_found') || text.includes('child_not_found')) {
        return { status: 404, error: 'Reward request was not found' };
    }
    if (text.includes('reward_not_available')) {
        return { status: 400, error: 'This reward is not available' };
    }
    if (text.includes('not_enough_xp')) {
        return { status: 400, error: 'Not enough XP to redeem this reward' };
    }
    if (text.includes('reward_not_owned_by_child_parent') || text.includes('profile_is_not_child')) {
        return { status: 403, error: 'This reward does not belong to the child account' };
    }
    if (text.includes('invalid_redemption_transition')) {
        return { status: 400, error: 'Invalid reward redemption status transition' };
    }
    if (text.includes('invalid_redemption_status')) {
        return { status: 400, error: 'Invalid reward redemption status' };
    }
    return { status: 500, error: text };
}

async function assertChildBelongsToParent(childId: string, parentId: string) {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, parent_id, role')
        .eq('id', childId)
        .single();

    if (error || !data) {
        return { ok: false as const, status: 404, error: 'Child profile not found' };
    }

    if (data.role !== 'child' || data.parent_id !== parentId) {
        return { ok: false as const, status: 403, error: 'Child does not belong to this parent' };
    }

    return { ok: true as const };
}

router.get('/reward-store', authenticate, async (req, res) => {
    const { parentId, childId } = req.query;

    if (!parentId && !childId) {
        res.status(400).json({ error: 'Provide parentId or childId' });
        return;
    }

    try {
        let resolvedParentId = typeof parentId === 'string' ? parentId : undefined;

        if (resolvedParentId) {
            const access = ensureParentAccess(req, resolvedParentId);
            if (!access.ok) {
                res.status(access.status).json({ error: access.error });
                return;
            }
        }

        if (childId && !resolvedParentId) {
            const childAccess = ensureChildAccess(req, String(childId));
            if (!childAccess.ok) {
                res.status(childAccess.status).json({ error: childAccess.error });
                return;
            }

            const { data: profile, error: profileErr } = await supabaseAdmin
                .from('profiles')
                .select('parent_id, role')
                .eq('id', String(childId))
                .single();

            if (profileErr || !profile?.parent_id || profile.role !== 'child') {
                res.status(404).json({ error: 'Child profile not found or not linked to a parent' });
                return;
            }

            if (req.user?.role === 'parent' && !isAdmin(req) && profile.parent_id !== req.user.id) {
                res.status(403).json({ error: 'Child does not belong to this parent' });
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
        res.json(data ?? []);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/reward-store', authenticate, async (req, res) => {
    const { parentId, title, description, costPoints } = req.body;
    const access = ensureParentAccess(req, parentId);

    if (!access.ok) {
        res.status(access.status).json({ error: access.error });
        return;
    }
    if (req.user?.role !== 'parent' && !isAdmin(req)) {
        res.status(403).json({ error: 'Only parents can create reward items' });
        return;
    }

    const normalizedTitle = typeof title === 'string' ? title.trim() : '';
    const normalizedCost = Number(costPoints);

    if (!normalizedTitle || !Number.isInteger(normalizedCost) || normalizedCost <= 0) {
        res.status(400).json({ error: 'title and positive integer costPoints are required' });
        return;
    }

    const { data, error } = await supabaseAdmin
        .from('reward_items')
        .insert({
            parent_id: access.parentId,
            title: normalizedTitle,
            description: typeof description === 'string' && description.trim() ? description.trim() : null,
            cost_points: normalizedCost,
        })
        .select()
        .single();

    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    res.status(201).json(data);
});

router.patch('/reward-store/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const { parentId, isActive } = req.body;
    const access = ensureParentAccess(req, parentId);

    if (!access.ok) {
        res.status(access.status).json({ error: access.error });
        return;
    }

    const { data, error } = await supabaseAdmin
        .from('reward_items')
        .update({ is_active: Boolean(isActive) })
        .eq('id', id)
        .eq('parent_id', access.parentId)
        .is('deleted_at', null)
        .select()
        .single();

    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    if (!data) {
        res.status(404).json({ error: 'Reward item not found' });
        return;
    }
    res.json(data);
});

router.delete('/reward-store/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const { parentId } = req.body;
    const access = ensureParentAccess(req, parentId);

    if (!access.ok) {
        res.status(access.status).json({ error: access.error });
        return;
    }

    const { error } = await supabaseAdmin
        .from('reward_items')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('parent_id', access.parentId);

    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    res.json({ success: true });
});

router.post('/reward-store/:id/redeem', authenticate, async (req, res) => {
    const { id } = req.params;
    const { childId } = req.body;
    const childAccess = ensureChildAccess(req, childId);

    if (!childAccess.ok) {
        res.status(childAccess.status).json({ error: childAccess.error });
        return;
    }
    if (req.user?.role !== 'child' && !isAdmin(req)) {
        res.status(403).json({ error: 'Only child accounts can redeem rewards' });
        return;
    }

    const { data, error } = await supabaseAdmin.rpc('redeem_reward_item', {
        p_reward_item_id: id,
        p_child_id: childAccess.childId,
    });

    if (error) {
        const mapped = mapRewardRpcError(error.message);
        res.status(mapped.status).json({ error: mapped.error });
        return;
    }

    const result = Array.isArray(data) ? data[0] : data;
    res.json({ xp: result?.xp ?? 0, redemptionId: result?.redemption_id });
});

router.get('/reward-redemptions', authenticate, async (req, res) => {
    const { childId, parentId } = req.query;

    if (!childId && !parentId) {
        res.status(400).json({ error: 'Provide childId or parentId' });
        return;
    }

    try {
        let query = supabaseAdmin
            .from('reward_redemptions')
            .select('*, profiles!reward_redemptions_child_id_fkey(full_name)')
            .order('requested_at', { ascending: false });

        if (childId) {
            const childAccess = ensureChildAccess(req, String(childId));
            if (!childAccess.ok) {
                res.status(childAccess.status).json({ error: childAccess.error });
                return;
            }

            if (req.user?.role === 'parent' && !isAdmin(req)) {
                const relation = await assertChildBelongsToParent(childAccess.childId, req.user.id);
                if (!relation.ok) {
                    res.status(relation.status).json({ error: relation.error });
                    return;
                }
            }

            query = query.eq('child_id', childAccess.childId);
        } else {
            const access = ensureParentAccess(req, parentId);
            if (!access.ok) {
                res.status(access.status).json({ error: access.error });
                return;
            }
            query = query.eq('parent_id', access.parentId);
        }

        const { data, error } = await query;

        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }
        res.json(data ?? []);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.patch('/reward-redemptions/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const { parentId, status } = req.body as { parentId?: string; status?: RedemptionStatus };
    const access = ensureParentAccess(req, parentId);

    if (!access.ok) {
        res.status(access.status).json({ error: access.error });
        return;
    }
    if (!status || !['approved', 'fulfilled', 'rejected'].includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
    }

    const { error: rpcError } = await supabaseAdmin.rpc('update_reward_redemption_status', {
        p_redemption_id: id,
        p_parent_id: access.parentId,
        p_status: status,
    });

    if (rpcError) {
        const mapped = mapRewardRpcError(rpcError.message);
        res.status(mapped.status).json({ error: mapped.error });
        return;
    }

    const { data, error } = await supabaseAdmin
        .from('reward_redemptions')
        .select('*, profiles!reward_redemptions_child_id_fkey(full_name)')
        .eq('id', id)
        .eq('parent_id', access.parentId)
        .single();

    if (error || !data) {
        res.status(500).json({ error: error?.message ?? 'Reward redemption updated but could not be reloaded' });
        return;
    }

    res.json(data);
});

router.patch('/reward-redemptions/:id/fulfill', authenticate, async (req, res) => {
    const { id } = req.params;
    const parentId = req.body.parentId ?? req.user?.id;
    const access = ensureParentAccess(req, parentId);

    if (!access.ok) {
        res.status(access.status).json({ error: access.error });
        return;
    }

    const { error: rpcError } = await supabaseAdmin.rpc('update_reward_redemption_status', {
        p_redemption_id: id,
        p_parent_id: access.parentId,
        p_status: 'fulfilled',
    });

    if (rpcError) {
        const mapped = mapRewardRpcError(rpcError.message);
        res.status(mapped.status).json({ error: mapped.error });
        return;
    }

    res.json({ success: true });
});

export default router;
