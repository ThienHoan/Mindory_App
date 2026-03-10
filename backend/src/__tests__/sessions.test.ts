import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import sessionsRouter from '../routes/sessions';

vi.mock('../lib/supabase', () => ({
    supabaseAdmin: {
        from: vi.fn(),
    },
}));

import { supabaseAdmin } from '../lib/supabase';

const app = express();
app.use(express.json());
app.use('/sessions', sessionsRouter);

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

describe('Sessions API Routes', () => {
    beforeEach(() => vi.clearAllMocks());

    describe('POST /sessions/start', () => {
        it('should return 400 when taskId or childId is missing', async () => {
            const res = await request(app).post('/sessions/start').send({ taskId: 'tid' });
            expect(res.status).toBe(400);
        });

        it('should return 400 if task is already completed', async () => {
            const chain = mockChain({
                single: vi.fn().mockResolvedValue({ data: { id: 'tid', status: 'completed' }, error: null }),
            });
            (supabaseAdmin.from as any).mockReturnValue(chain);

            const res = await request(app).post('/sessions/start').send({ taskId: 'tid', childId: 'cid' });
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('already completed');
        });

        it('should create a session and return 201', async () => {
            const sessionData = { id: 'sess-1', task_id: 'tid', child_id: 'cid' };
            let callCount = 0;
            (supabaseAdmin.from as any).mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    // First call: find task
                    return mockChain({ single: vi.fn().mockResolvedValue({ data: { id: 'tid', status: 'pending' }, error: null }) });
                }
                if (callCount === 2) {
                    // Second call: insert session
                    return mockChain({ single: vi.fn().mockResolvedValue({ data: sessionData, error: null }) });
                }
                // Third call: update task status
                return mockChain({ single: vi.fn().mockResolvedValue({ data: null, error: null }) });
            });

            const res = await request(app).post('/sessions/start').send({ taskId: 'tid', childId: 'cid' });
            expect(res.status).toBe(201);
            expect(res.body).toEqual(sessionData);
        });
    });

    describe('POST /sessions/:id/finish', () => {
        it('should return 400 if childId missing', async () => {
            const res = await request(app).post('/sessions/sess-1/finish').send({});
            expect(res.status).toBe(400);
        });

        it('should return 400 if session already completed', async () => {
            const chain = mockChain({
                single: vi.fn().mockResolvedValue({ data: { id: 'sess-1', completed: true }, error: null }),
            });
            (supabaseAdmin.from as any).mockReturnValue(chain);

            const res = await request(app).post('/sessions/sess-1/finish').send({ childId: 'cid', quizScore: 3, quizTotal: 5 });
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('already completed');
        });
    });

    describe('GET /sessions/mine', () => {
        it('should return 400 if childId is missing', async () => {
            const res = await request(app).get('/sessions/mine');
            expect(res.status).toBe(400);
        });

        it('should return session history for a child', async () => {
            const sessionList = [{ id: 'sess-1', focus_minutes: 20 }];
            const chain = mockChain({ order: vi.fn().mockResolvedValue({ data: sessionList, error: null }) });
            (supabaseAdmin.from as any).mockReturnValue(chain);

            const res = await request(app).get('/sessions/mine?childId=cid');
            expect(res.status).toBe(200);
            expect(res.body).toEqual(sessionList);
        });
    });

    describe('GET /sessions/stats', () => {
        it('should return 400 if parentId is missing', async () => {
            const res = await request(app).get('/sessions/stats');
            expect(res.status).toBe(400);
        });

        it('should return empty stats if parent has no children', async () => {
            let callCount = 0;
            (supabaseAdmin.from as any).mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    return mockChain({ eq: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [], error: null }) });
                }
                return mockChain();
            });

            const res = await request(app).get('/sessions/stats?parentId=pid');
            expect(res.status).toBe(200);
            expect(res.body.avgFocusMinutes).toBe(0);
        });
    });
});
