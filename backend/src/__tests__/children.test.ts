import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import childrenRouter from '../routes/children';

vi.mock('../lib/supabase', () => ({
    supabaseAdmin: {
        auth: { admin: { createUser: vi.fn() } },
        from: vi.fn(),
    },
}));

import { supabaseAdmin } from '../lib/supabase';

const app = express();
app.use(express.json());
app.use('/children', childrenRouter);

// RFC 4122 v4 compliant UUIDs
const PARENT_UUID = '550e8400-e29b-41d4-a716-446655440000';
const CHILD_UUID = '550e8400-e29b-41d4-a716-446655440001';

describe('Children API Routes', () => {
    beforeEach(() => vi.clearAllMocks());

    describe('POST /children', () => {
        it('should successfully create a child profile and link to parent', async () => {
            const mockUserResponse = { data: { user: { id: CHILD_UUID } }, error: null };
            (supabaseAdmin.auth.admin.createUser as any).mockResolvedValue(mockUserResponse);

            const mockEq = vi.fn().mockResolvedValue({ error: null });
            const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
            (supabaseAdmin.from as any).mockReturnValue({ update: mockUpdate });

            const response = await request(app).post('/children').send({
                email: 'testchild@example.com',
                password: 'password123',
                fullName: 'Test Child',
                parentId: PARENT_UUID,
            });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: true, user: mockUserResponse.data.user });
        });

        it('should return 400 if Zod validation fails (short password, bad UUID)', async () => {
            const response = await request(app).post('/children').send({
                email: 'bad@email',       // invalid email
                password: 'pass',         // < 6 chars
                fullName: 'Child',
                parentId: 'not-a-uuid',   // invalid UUID
            });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /children', () => {
        it('should return a paginated list of children for a specific parent', async () => {
            const mockChildren = [
                { id: '1', full_name: 'Child 1', role: 'child' },
                { id: '2', full_name: 'Child 2', role: 'child' },
            ];

            const mockRange = vi.fn().mockResolvedValue({ data: mockChildren, error: null, count: 2 });
            const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
            const mockIs = vi.fn().mockReturnValue({ order: mockOrder });
            const mockEqRole = vi.fn().mockReturnValue({ is: mockIs });
            const mockEqParentId = vi.fn().mockReturnValue({ eq: mockEqRole });
            const mockSelect = vi.fn().mockReturnValue({ eq: mockEqParentId });
            (supabaseAdmin.from as any).mockReturnValue({ select: mockSelect });

            const response = await request(app).get('/children?parentId=mock-parent-id');

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockChildren);
            expect(response.body.total).toBe(2);
        });

        it('should return 400 if parentId is missing', async () => {
            const response = await request(app).get('/children');
            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: 'Missing parentId' });
        });
    });

    describe('PATCH /children/:id', () => {
        it('should update child profile', async () => {
            const mockChild = { id: 'child-1' };
            const mockSingle = vi.fn().mockResolvedValue({ data: mockChild, error: null });
            const mockIs = vi.fn().mockReturnValue({ single: mockSingle });
            const mockEq3 = vi.fn().mockReturnValue({ is: mockIs });
            const mockEq2 = vi.fn().mockReturnValue({ eq: mockEq3 });
            const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
            
            const mockUpdateSelect = vi.fn().mockReturnValue({ single: mockSingle });
            const mockUpdateEq = vi.fn().mockReturnValue({ select: mockUpdateSelect });
            const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });

            (supabaseAdmin.from as any).mockReturnValue({ 
                select: vi.fn().mockReturnValue({ eq: mockEq1 }),
                update: mockUpdate
            });

            const response = await request(app).patch('/children/child-1').send({
                parentId: PARENT_UUID,
                fullName: 'New Name'
            });

            expect(response.status).toBe(200);
        });
    });

    describe('DELETE /children/:id', () => {
        it('should soft delete child profile', async () => {
            const mockChild = { id: 'child-1' };
            const mockSingle = vi.fn().mockResolvedValue({ data: mockChild, error: null });
            const mockIs = vi.fn().mockReturnValue({ single: mockSingle });
            const mockEq3 = vi.fn().mockReturnValue({ is: mockIs });
            const mockEq2 = vi.fn().mockReturnValue({ eq: mockEq3 });
            const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
            
            const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
            const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });

            (supabaseAdmin.from as any).mockReturnValue({ 
                select: vi.fn().mockReturnValue({ eq: mockEq1 }),
                update: mockUpdate
            });

            const response = await request(app).delete('/children/child-1').send({
                parentId: PARENT_UUID
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
});
