import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// GET /rewards/mine - Child: Lấy kho báu của bé đang login
router.get('/mine', async (req, res) => {
    const { childId } = req.query;
    if (!childId) {
        res.status(400).json({ error: 'Missing required query param: childId' });
        return;
    }

    const { data, error } = await supabaseAdmin
        .from('rewards')
        .select('*, learning_sessions!inner(child_id)')
        .eq('learning_sessions.child_id', String(childId))
        .order('created_at', { ascending: false });

    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    res.json(data);
});

// PATCH /rewards/:id/claim - Bé nhận phần thưởng
router.patch('/:id/claim', async (req, res) => {
    const { id } = req.params;
    const { childId } = req.body;

    if (!childId) {
        res.status(400).json({ error: 'Missing required field: childId' });
        return;
    }

    try {
        // Check reward thuộc về bé này (bảo vệ khỏi bypass)
        const { data: reward, error: findError } = await supabaseAdmin
            .from('rewards')
            .select('id, claimed_at, learning_sessions!inner(child_id)')
            .eq('id', id)
            .single();

        if (findError || !reward) {
            res.status(404).json({ error: 'Reward not found' });
            return;
        }

        const session = reward.learning_sessions as any;
        if (session?.child_id !== childId) {
            res.status(403).json({ error: 'This reward does not belong to you' });
            return;
        }

        if (reward.claimed_at) {
            res.status(400).json({ error: 'Reward already claimed' });
            return;
        }

        const { data: updated, error: updateError } = await supabaseAdmin
            .from('rewards')
            .update({ claimed_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;
        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
