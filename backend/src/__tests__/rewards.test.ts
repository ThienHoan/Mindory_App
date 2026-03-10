import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import rewardsRouter from '../routes/rewards';

vi.mock('../lib/supabase', () => ({
    supabaseAdmin: {
        from: vi.fn(),
    },
}));

import { supabaseAdmin } from '../lib/supabase';

const app = express();
app.use(express.json());
app.use('/rewards', rewardsRouter);

const mockChain = (overrides: Record<string, any> = {}) => ({
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
});

describe('Rewards API Routes', () => {
    beforeEach(() => vi.clearAllMocks());

    describe('GET /rewards/mine', () => {
        it('should return 400 if childId is missing', async () => {
            const res = await request(app).get('/rewards/mine');
            expect(res.status).toBe(400);
        });

        it('should return rewards for a child', async () => {
            const rewardList = [{ id: 'r1', reward_type: 'game' }];
            const chain = mockChain({ order: vi.fn().mockResolvedValue({ data: rewardList, error: null }) });
            (supabaseAdmin.from as any).mockReturnValue(chain);

            const res = await request(app).get('/rewards/mine?childId=cid');
            expect(res.status).toBe(200);
            expect(res.body).toEqual(rewardList);
        });
    });

    describe('PATCH /rewards/:id/claim', () => {
        it('should return 400 if childId is missing', async () => {
            const res = await request(app).patch('/rewards/r1/claim').send({});
            expect(res.status).toBe(400);
        });

        it('should return 400 if reward is already claimed', async () => {
            const chain = mockChain({
                single: vi.fn().mockResolvedValue({
                    data: { id: 'r1', claimed_at: '2025-01-01', learning_sessions: { child_id: 'cid' } },
                    error: null,
                }),
            });
            (supabaseAdmin.from as any).mockReturnValue(chain);

            const res = await request(app).patch('/rewards/r1/claim').send({ childId: 'cid' });
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('already claimed');
        });

        it('should return 403 if reward does not belong to child', async () => {
            const chain = mockChain({
                single: vi.fn().mockResolvedValue({
                    data: { id: 'r1', claimed_at: null, learning_sessions: { child_id: 'another-child' } },
                    error: null,
                }),
            });
            (supabaseAdmin.from as any).mockReturnValue(chain);

            const res = await request(app).patch('/rewards/r1/claim').send({ childId: 'cid' });
            expect(res.status).toBe(403);
        });
    });
});
