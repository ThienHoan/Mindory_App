import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import miniGamesRouter from '../routes/miniGames';

vi.mock('../lib/supabase', () => ({
    supabaseAdmin: {
        from: vi.fn(),
    },
}));

import { supabaseAdmin } from '../lib/supabase';

const app = express();
app.use(express.json());
app.use('/mini-games', miniGamesRouter);

const mockChain = (overrides: Record<string, any> = {}) => {
    const base = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        ...overrides,
    };
    return base;
};

describe('Mini Games API Routes', () => {
    beforeEach(() => vi.clearAllMocks());

    it('POST /mini-games/play should return 400 when missing childId or gameId', async () => {
        const res = await request(app).post('/mini-games/play').send({ childId: 'cid' });
        expect(res.status).toBe(400);
    });

    it('POST /mini-games/play should create play session and return stats', async () => {
        let callCount = 0;
        (supabaseAdmin.from as any).mockImplementation(() => {
            callCount += 1;
            if (callCount === 1) {
                return mockChain({
                    single: vi.fn().mockResolvedValue({
                        data: { id: 'row-1', game_id: 'number' },
                        error: null,
                    }),
                });
            }
            return mockChain({
                order: vi.fn().mockResolvedValue({
                    data: [
                        { played_at: new Date().toISOString(), stars_earned: 6 },
                    ],
                    error: null,
                }),
            });
        });

        const res = await request(app).post('/mini-games/play').send({
            childId: 'cid',
            gameId: 'number',
            score: 90,
            accuracy: 95,
            durationSeconds: 30,
            starsEarned: 6,
        });

        expect(res.status).toBe(201);
        expect(res.body.totalStars).toBe(6);
        expect(res.body.currentStreak).toBeGreaterThanOrEqual(0);
    });

    it('GET /mini-games/stats should return 400 when parentId missing', async () => {
        const res = await request(app).get('/mini-games/stats');
        expect(res.status).toBe(400);
    });

    it('GET /mini-games/stats should return empty stats when no children', async () => {
        (supabaseAdmin.from as any).mockReturnValue(
            mockChain({
                eq: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
            })
        );

        const res = await request(app).get('/mini-games/stats?parentId=pid');
        expect(res.status).toBe(200);
        expect(res.body.totalPlays).toBe(0);
    });
});
