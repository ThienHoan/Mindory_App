/**
 * Admin Authorization Tests
 * Verifies that:
 * - Parent role is denied access to admin-only routes (403)
 * - Admin role can access all admin routes (200/201)
 * - GET /admin/list endpoints are protected (not public)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import subjectsRouter from '../routes/subjects';
import lessonsRouter from '../routes/lessons';
import quizzesRouter from '../routes/quizzes';

// Mock supabase
vi.mock('../lib/supabase', () => ({
    supabaseAdmin: {
        auth: { getUser: vi.fn() },
        from: vi.fn(),
    },
}));

import { supabaseAdmin } from '../lib/supabase';

// --- Helper: Create mock auth responses ---
function mockUserWithRole(role: string) {
    (supabaseAdmin.auth.getUser as any).mockResolvedValue({
        data: {
            user: {
                id: 'user-123',
                email: 'test@example.com',
                app_metadata: { role },
            },
        },
        error: null,
    });
}

// Build test app
const app = express();
app.use(express.json());
app.use('/subjects', subjectsRouter);
app.use('/lessons', lessonsRouter);
app.use('/quizzes', quizzesRouter);

const SUBJECT_ID = '550e8400-e29b-41d4-a716-446655440010';
const LESSON_ID  = '550e8400-e29b-41d4-a716-446655440011';

describe('Admin Authorization', () => {
    beforeEach(() => vi.clearAllMocks());

    // ═══════════════════════════════════════════════════
    // POST /subjects — must reject non-admin
    // ═══════════════════════════════════════════════════
    describe('POST /subjects', () => {
        it('returns 403 for parent role', async () => {
            mockUserWithRole('parent');
            const res = await request(app)
                .post('/subjects')
                .set('Authorization', 'Bearer valid-token')
                .send({ name: 'Toán', grade: 1 });
            expect(res.status).toBe(403);
        });

        it('returns 403 for child role', async () => {
            mockUserWithRole('child');
            const res = await request(app)
                .post('/subjects')
                .set('Authorization', 'Bearer valid-token')
                .send({ name: 'Toán', grade: 1 });
            expect(res.status).toBe(403);
        });

        it('returns 201 for admin role', async () => {
            mockUserWithRole('admin');
            const mockSingle = vi.fn().mockResolvedValue({ data: { id: SUBJECT_ID, name: 'Toán', grade: 1 }, error: null });
            const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
            const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
            (supabaseAdmin.from as any).mockReturnValue({ insert: mockInsert });

            const res = await request(app)
                .post('/subjects')
                .set('Authorization', 'Bearer valid-token')
                .send({ name: 'Toán', grade: 1 });
            expect(res.status).toBe(201);
        });
    });

    // ═══════════════════════════════════════════════════
    // GET /subjects/admin/list — must be protected
    // ═══════════════════════════════════════════════════
    describe('GET /subjects/admin/list', () => {
        it('returns 401 with no token', async () => {
            const res = await request(app).get('/subjects/admin/list');
            expect(res.status).toBe(401);
        });

        it('returns 403 for parent role', async () => {
            mockUserWithRole('parent');
            const res = await request(app)
                .get('/subjects/admin/list')
                .set('Authorization', 'Bearer valid-token');
            expect(res.status).toBe(403);
        });

        it('returns 200 for admin role', async () => {
            mockUserWithRole('admin');
            const chain: any = {
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
            };
            (supabaseAdmin.from as any).mockReturnValue(chain);

            const res = await request(app)
                .get('/subjects/admin/list')
                .set('Authorization', 'Bearer valid-token');
            expect(res.status).toBe(200);
        });
    });

    // ═══════════════════════════════════════════════════
    // GET /lessons/admin/list — must be protected
    // ═══════════════════════════════════════════════════
    describe('GET /lessons/admin/list', () => {
        it('returns 403 for parent role', async () => {
            mockUserWithRole('parent');
            const res = await request(app)
                .get('/lessons/admin/list')
                .set('Authorization', 'Bearer valid-token');
            expect(res.status).toBe(403);
        });
    });

    // ═══════════════════════════════════════════════════
    // GET /quizzes/admin/list — must be protected
    // ═══════════════════════════════════════════════════
    describe('GET /quizzes/admin/list', () => {
        it('returns 403 for parent role', async () => {
            mockUserWithRole('parent');
            const res = await request(app)
                .get(`/quizzes/admin/list?lessonId=${LESSON_ID}`)
                .set('Authorization', 'Bearer valid-token');
            expect(res.status).toBe(403);
        });
    });

    // ═══════════════════════════════════════════════════
    // DELETE /subjects/:id — protected
    // ═══════════════════════════════════════════════════
    describe('DELETE /subjects/:id', () => {
        it('returns 403 for parent', async () => {
            mockUserWithRole('parent');
            const res = await request(app)
                .delete(`/subjects/${SUBJECT_ID}`)
                .set('Authorization', 'Bearer valid-token');
            expect(res.status).toBe(403);
        });
    });
});
