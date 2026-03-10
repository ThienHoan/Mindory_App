import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import subjectsRouter from '../routes/subjects';
import lessonsRouter from '../routes/lessons';
import quizzesRouter from '../routes/quizzes';

vi.mock('../lib/supabase', () => ({
    supabaseAdmin: { from: vi.fn() },
}));

vi.mock('../middleware/auth', () => ({
    authenticate: (_req: any, _res: any, next: any) => next(),
}));
vi.mock('../middleware/requireRole', () => ({
    requireRole: () => (_req: any, _res: any, next: any) => next(),
}));

import { supabaseAdmin } from '../lib/supabase';

const app = express();
app.use(express.json());
app.use('/subjects', subjectsRouter);
app.use('/lessons', lessonsRouter);
app.use('/quizzes', quizzesRouter);

// subjects & lessons GET chain: select(*, {count}) -> is() -> order() -> range()
const mockPaginatedChain = (data: any[]) => {
    const chain: any = {
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data, error: null, count: data.length }),
    };
    // Make all methods return the same chain so chaining works in any order
    Object.keys(chain).forEach(k => {
        if (k !== 'range') chain[k].mockReturnValue(chain);
    });
    return chain;
};

// quizzes GET chain: select -> eq -> is -> order (resolves directly)
const mockSimpleChain = (data: any[]) => {
    const chain: any = {
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data, error: null }),
    };
    Object.keys(chain).forEach(k => {
        if (k !== 'order') chain[k].mockReturnValue(chain);
    });
    return chain;
};

describe('Content Management API Routes', () => {
    beforeEach(() => vi.clearAllMocks());

    describe('GET /subjects', () => {
        it('should return paginated subjects', async () => {
            const subjects = [{ id: 's1', name: 'Toán', grade: 3 }];
            (supabaseAdmin.from as any).mockReturnValue(mockPaginatedChain(subjects));

            const res = await request(app).get('/subjects');
            expect(res.status).toBe(200);
            expect(res.body.data).toEqual(subjects);
            expect(res.body.total).toBe(1);
        });
    });

    describe('POST /subjects', () => {
        it('should return 400 if grade is missing (Zod validation)', async () => {
            const res = await request(app).post('/subjects').send({ name: 'Toán' });
            expect(res.status).toBe(400);
        });
    });

    describe('GET /lessons', () => {
        it('should return paginated lessons filtered by subjectId', async () => {
            const lessons = [{ id: 'l1', title: 'Bài 1' }];
            (supabaseAdmin.from as any).mockReturnValue(mockPaginatedChain(lessons));

            const res = await request(app).get('/lessons?subjectId=s1');
            expect(res.status).toBe(200);
            expect(res.body.data).toEqual(lessons);
        });
    });

    describe('GET /quizzes', () => {
        it('should return 400 if lessonId is missing', async () => {
            const res = await request(app).get('/quizzes');
            expect(res.status).toBe(400);
        });

        it('should return quiz questions for a lesson', async () => {
            const quizzes = [{ id: 'q1', question: 'Test?', options: ['A', 'B', 'C', 'D'], correct_index: 0 }];
            (supabaseAdmin.from as any).mockReturnValue(mockSimpleChain(quizzes));

            const res = await request(app).get('/quizzes?lessonId=l1');
            expect(res.status).toBe(200);
            expect(res.body).toEqual(quizzes);
        });
    }); // end GET /quizzes

    describe('Admin Mutations (Subjects/Lessons/Quizzes)', () => {
        it('PUT /subjects/:id should update a subject', async () => {
            const mockSingle = vi.fn().mockResolvedValue({ data: { id: 's1' }, error: null });
            const mockIs = vi.fn().mockReturnValue({ single: mockSingle });
            const mockEq = vi.fn().mockReturnValue({ is: mockIs, select: vi.fn().mockReturnValue({ single: mockSingle }) });
            (supabaseAdmin.from as any).mockReturnValue({ 
                select: vi.fn().mockReturnValue({ eq: mockEq }),
                update: vi.fn().mockReturnValue({ eq: mockEq })
            });

            const res = await request(app).put('/subjects/s1').send({ name: 'Văn' });
            expect(res.status).toBe(200);
        });

        it('DELETE /lessons/:id should soft delete a lesson', async () => {
            const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'l1' }, error: null });
            const mockIs = vi.fn().mockReturnValue({ single: mockSingle });
            const mockEq = vi.fn().mockReturnValue({ is: mockIs });
            const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
            (supabaseAdmin.from as any).mockReturnValue({ 
                select: vi.fn().mockReturnValue({ eq: mockEq }),
                update: vi.fn().mockReturnValue({ eq: mockUpdateEq })
            });

            const res = await request(app).delete('/lessons/l1');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
