import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import tasksRouter from '../routes/tasks';

vi.mock('../lib/supabase', () => ({
    supabaseAdmin: { from: vi.fn() },
}));

import { supabaseAdmin } from '../lib/supabase';

const app = express();
app.use(express.json());
app.use('/tasks', tasksRouter);

// RFC 4122 v4 compliant UUIDs (required by Zod v4)
const CHILD_ID = '550e8400-e29b-41d4-a716-446655440000';
const LESSON_ID = '550e8400-e29b-41d4-a716-446655440001';
const PARENT_ID = '550e8400-e29b-41d4-a716-446655440002';

describe('Tasks API Routes', () => {
    beforeEach(() => vi.clearAllMocks());

    describe('POST /tasks', () => {
        it('should successfully create an assigned task with valid UUIDs', async () => {
            const mockTaskData = { id: '550e8400-e29b-41d4-a716-446655440099', status: 'pending' };
            const mockSingle = vi.fn().mockResolvedValue({ data: mockTaskData, error: null });
            const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
            const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
            (supabaseAdmin.from as any).mockReturnValue({ insert: mockInsert });

            const payload = {
                childId: CHILD_ID,
                lessonId: LESSON_ID,
                parentId: PARENT_ID,
                sessionDuration: 30,
                sessionsPerDay: 2,
                startPage: 1,
                endPage: 10,
            };

            const response = await request(app).post('/tasks').send(payload);

            expect(response.status).toBe(201);
            expect(response.body).toEqual(mockTaskData);
        });

        it('should return 400 if required fields are missing', async () => {
            const response = await request(app).post('/tasks').send({ childId: 'not-valid' });
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    describe('PUT /tasks/:id', () => {
        it('should update an uncompleted task', async () => {
            const mockTaskData = { id: 'task-1', status: 'pending' };
            const chain: any = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                is: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockTaskData, error: null }),
            };
            const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: mockTaskData, error: null }) }) }) });
            (supabaseAdmin.from as any).mockReturnValue({ ...chain, update: mockUpdate });

            const response = await request(app).put('/tasks/task-1').send({
                parentId: PARENT_ID,
                sessionDuration: 45
            });

            expect(response.status).toBe(200);
        });

        it('should return 400 if trying to edit a completed task', async () => {
            const mockTaskData = { id: 'task-1', status: 'completed' };
            const chain: any = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                is: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockTaskData, error: null }),
            };
            (supabaseAdmin.from as any).mockReturnValue(chain);

            const response = await request(app).put('/tasks/task-1').send({
                parentId: PARENT_ID,
                sessionDuration: 45
            });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('completed');
        });
    });

    describe('DELETE /tasks/:id', () => {
        it('should soft delete a task', async () => {
            const mockTaskData = { id: 'task-1' };
            const chain: any = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                is: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockTaskData, error: null }),
            };
            const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
            
            (supabaseAdmin.from as any).mockReturnValue({ 
                ...chain,
                update: vi.fn().mockReturnValue({ eq: mockUpdateEq })
            });

            const response = await request(app).delete('/tasks/task-1').send({
                parentId: PARENT_ID
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
});
});
