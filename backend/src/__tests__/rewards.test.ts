import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import rewardsRouter from '../routes/rewards';

vi.mock('../lib/supabase', () => ({
    supabaseAdmin: {
        auth: { getUser: vi.fn() },
        from: vi.fn(),
        rpc: vi.fn(),
    },
}));

import { supabaseAdmin } from '../lib/supabase';

const app = express();
app.use(express.json());
app.use(rewardsRouter);

const PARENT_ID = '550e8400-e29b-41d4-a716-446655440001';
const CHILD_ID = '550e8400-e29b-41d4-a716-446655440002';
const OTHER_ID = '550e8400-e29b-41d4-a716-446655440003';
const ITEM_ID = '550e8400-e29b-41d4-a716-446655440004';
const REDEMPTION_ID = '550e8400-e29b-41d4-a716-446655440005';

function authAs(id: string, role: 'parent' | 'child' | 'admin') {
    (supabaseAdmin.auth.getUser as any).mockResolvedValue({
        data: { user: { id, email: `${role}@test.dev`, app_metadata: { role } } },
        error: null,
    });
}

function bearer() {
    return { Authorization: 'Bearer valid-token' };
}

function mockChain(overrides: Record<string, any> = {}) {
    return {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        ...overrides,
    };
}

describe('Reward store and redemptions API', () => {
    beforeEach(() => vi.clearAllMocks());

    it('requires authentication', async () => {
        const res = await request(app).get(`/reward-store?parentId=${PARENT_ID}`);
        expect(res.status).toBe(401);
    });

    it('rejects parent access to another parent reward store', async () => {
        authAs(PARENT_ID, 'parent');

        const res = await request(app)
            .get(`/reward-store?parentId=${OTHER_ID}`)
            .set(bearer());

        expect(res.status).toBe(403);
        expect(supabaseAdmin.from).not.toHaveBeenCalled();
    });

    it('creates a reward item for the authenticated parent', async () => {
        authAs(PARENT_ID, 'parent');
        const reward = { id: ITEM_ID, parent_id: PARENT_ID, title: 'Movie time', cost_points: 100 };
        const chain = mockChain({ single: vi.fn().mockResolvedValue({ data: reward, error: null }) });
        (supabaseAdmin.from as any).mockReturnValue(chain);

        const res = await request(app)
            .post('/reward-store')
            .set(bearer())
            .send({ parentId: PARENT_ID, title: 'Movie time', costPoints: 100 });

        expect(res.status).toBe(201);
        expect(res.body).toEqual(reward);
        expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ parent_id: PARENT_ID, cost_points: 100 }));
    });

    it('rejects invalid reward cost', async () => {
        authAs(PARENT_ID, 'parent');

        const res = await request(app)
            .post('/reward-store')
            .set(bearer())
            .send({ parentId: PARENT_ID, title: 'Bad reward', costPoints: 0 });

        expect(res.status).toBe(400);
        expect(supabaseAdmin.from).not.toHaveBeenCalled();
    });

    it('redeems through the atomic database RPC', async () => {
        authAs(CHILD_ID, 'child');
        (supabaseAdmin.rpc as any).mockResolvedValue({
            data: [{ xp: 50, redemption_id: REDEMPTION_ID }],
            error: null,
        });

        const res = await request(app)
            .post(`/reward-store/${ITEM_ID}/redeem`)
            .set(bearer())
            .send({ childId: CHILD_ID });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ xp: 50, redemptionId: REDEMPTION_ID });
        expect(supabaseAdmin.rpc).toHaveBeenCalledWith('redeem_reward_item', {
            p_reward_item_id: ITEM_ID,
            p_child_id: CHILD_ID,
        });
    });

    it('updates a redemption status through the atomic database RPC', async () => {
        authAs(PARENT_ID, 'parent');
        const redemption = { id: REDEMPTION_ID, parent_id: PARENT_ID, status: 'fulfilled' };
        const chain = mockChain({ single: vi.fn().mockResolvedValue({ data: redemption, error: null }) });
        (supabaseAdmin.rpc as any).mockResolvedValue({ data: redemption, error: null });
        (supabaseAdmin.from as any).mockReturnValue(chain);

        const res = await request(app)
            .patch(`/reward-redemptions/${REDEMPTION_ID}`)
            .set(bearer())
            .send({ parentId: PARENT_ID, status: 'fulfilled' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(redemption);
        expect(supabaseAdmin.rpc).toHaveBeenCalledWith('update_reward_redemption_status', {
            p_redemption_id: REDEMPTION_ID,
            p_parent_id: PARENT_ID,
            p_status: 'fulfilled',
        });
    });
});
