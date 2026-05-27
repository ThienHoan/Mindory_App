/**
 * Admin Role Normalization Tests
 * Verifies that normalizeRole() in auth.ts correctly:
 * - Accepts valid roles (admin, parent, child)
 * - Falls back to 'parent' for unknown/malicious claim values
 * - Logs a warning for unknown values
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import subjectsRouter from '../routes/subjects';

vi.mock('../lib/supabase', () => ({
    supabaseAdmin: {
        auth: { getUser: vi.fn() },
        from: vi.fn(),
    },
}));

import { supabaseAdmin } from '../lib/supabase';

const app = express();
app.use(express.json());
app.use('/subjects', subjectsRouter);

function mockUserWithRawClaim(role: unknown) {
    (supabaseAdmin.auth.getUser as any).mockResolvedValue({
        data: {
            user: {
                id: 'user-abc',
                email: 'test@example.com',
                app_metadata: { role },
            },
        },
        error: null,
    });
}

describe('Role Normalization in auth middleware', () => {
    beforeEach(() => vi.clearAllMocks());

    it('allows "admin" claim → passes requireRole("admin")', async () => {
        mockUserWithRawClaim('admin');

        const chain: any = {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
        };
        (supabaseAdmin.from as any).mockReturnValue(chain);

        const res = await request(app)
            .get('/subjects/admin/list')
            .set('Authorization', 'Bearer token');
        expect(res.status).toBe(200);
    });

    it('rejects unknown claim "superuser" → falls back to parent → 403 on admin route', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        mockUserWithRawClaim('superuser');

        const res = await request(app)
            .get('/subjects/admin/list')
            .set('Authorization', 'Bearer token');

        expect(res.status).toBe(403);
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('Unknown role value: "superuser"')
        );
        warnSpy.mockRestore();
    });

    it('rejects null claim → falls back to parent via DB fallback → 403', async () => {
        // null claim → goes to DB fallback path
        mockUserWithRawClaim(null);
        // DB fallback returns unknown role
        const mockSingle = vi.fn().mockResolvedValue({ data: { role: 'unknown_db_role' }, error: null });
        const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
        (supabaseAdmin.from as any).mockReturnValue({ select: mockSelect });

        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const res = await request(app)
            .get('/subjects/admin/list')
            .set('Authorization', 'Bearer token');

        expect(res.status).toBe(403);
        warnSpy.mockRestore();
    });

    it('rejects "child" claim → 403 on admin route', async () => {
        mockUserWithRawClaim('child');

        const res = await request(app)
            .post('/subjects')
            .set('Authorization', 'Bearer token')
            .send({ name: 'Test', grade: 1 });
        expect(res.status).toBe(403);
    });
});
