import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { validate } from '../middleware/validate';

const router = Router();

// ---- Zod Schemas ----
const createTaskSchema = z.object({
    childId: z.string().uuid(),
    lessonId: z.string().uuid(),
    parentId: z.string().uuid(),
    sessionDuration: z.number().int().min(1).max(180).optional().default(15),
    sessionsPerDay: z.number().int().min(1).max(10).optional().default(1),
    startPage: z.number().int().min(1).optional().default(1),
    endPage: z.number().int().min(1).optional().default(1),
    assignedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    focusIntervalSeconds: z.number().int().min(60).max(1800).optional(),
    breakSeconds: z.number().int().min(10).max(300).optional(),
    gameBreakSeconds: z.number().int().min(10).max(300).optional(),
    allowGameBreak: z.boolean().optional(),
});

const updateTaskSchema = z.object({
    parentId: z.string().uuid(),
    sessionDuration: z.number().int().min(1).max(180).optional(),
    sessionsPerDay: z.number().int().min(1).max(10).optional(),
    startPage: z.number().int().min(1).optional(),
    endPage: z.number().int().min(1).optional(),
    focusIntervalSeconds: z.number().int().min(60).max(1800).optional(),
    breakSeconds: z.number().int().min(10).max(300).optional(),
    gameBreakSeconds: z.number().int().min(10).max(300).optional(),
    allowGameBreak: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 1, {
    message: 'At least one field to update must be provided',
});

const deleteTaskSchema = z.object({ parentId: z.string().uuid() });
const patchStatusSchema = z.object({
    status: z.enum(['pending', 'in_progress', 'completed']),
    childId: z.string().uuid(),
});

// Helper
function getPagination(query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    return { from: (page - 1) * limit, to: page * limit - 1 };
}

// POST /tasks
router.post('/', validate(createTaskSchema), async (req, res) => {
    const {
        childId,
        lessonId,
        parentId,
        sessionDuration,
        sessionsPerDay,
        startPage,
        endPage,
        assignedDate,
        focusIntervalSeconds,
        breakSeconds,
        gameBreakSeconds,
        allowGameBreak,
    } = req.body;

    const insertPayload: Record<string, any> = {
        child_id: childId,
        lesson_id: lessonId,
        assigned_by: parentId,
        session_duration_minutes: sessionDuration,
        sessions_per_day: sessionsPerDay,
        start_page: startPage,
        end_page: endPage,
        status: 'pending',
    };

    if (assignedDate !== undefined) insertPayload.assigned_date = assignedDate;
    if (focusIntervalSeconds !== undefined) insertPayload.focus_interval_seconds = focusIntervalSeconds;
    if (breakSeconds !== undefined) insertPayload.break_seconds = breakSeconds;
    if (gameBreakSeconds !== undefined) insertPayload.game_break_seconds = gameBreakSeconds;
    if (allowGameBreak !== undefined) insertPayload.allow_game_break = allowGameBreak;

    try {
        const { data, error } = await supabaseAdmin
            .from('assigned_tasks')
            .insert(insertPayload)
            .select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// GET /tasks/mine
router.get('/mine', async (req, res) => {
    const { childId } = req.query;
    if (!childId) { res.status(400).json({ error: 'Missing required query param: childId' }); return; }
    const { from, to } = getPagination(req.query);
    const { data, error, count } = await supabaseAdmin
        .from('assigned_tasks')
        .select('*, lessons(title, description, pdf_url, pdf_path, total_pages)', { count: 'exact' })
        .eq('child_id', String(childId)).is('deleted_at', null)
        .order('assigned_date', { ascending: false }).range(from, to);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data, total: count });
});

// GET /tasks/:id — Chi tiết 1 task
router.get('/:id', async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('assigned_tasks')
        .select('*, lessons(id, title, description, pdf_url, pdf_path, total_pages), profiles!assigned_tasks_child_id_fkey(id, full_name)')
        .eq('id', req.params.id).is('deleted_at', null).single();
    if (error || !data) { res.status(404).json({ error: 'Task not found' }); return; }
    res.json(data);
});

// GET /tasks — Parent view
router.get('/', async (req, res) => {
    const { childId } = req.query;
    if (!childId) { res.status(400).json({ error: 'Missing required query param: childId' }); return; }
    const { from, to } = getPagination(req.query);
    const { data, error, count } = await supabaseAdmin
        .from('assigned_tasks')
        .select('*, lessons(title, description), profiles!assigned_tasks_child_id_fkey(full_name)', { count: 'exact' })
        .eq('child_id', String(childId)).is('deleted_at', null)
        .order('assigned_date', { ascending: false }).range(from, to);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data, total: count });
});

// PUT /tasks/:id — Parent sửa bài đã giao
router.put('/:id', validate(updateTaskSchema), async (req, res) => {
    const { id } = req.params;
    const {
        parentId,
        sessionDuration,
        sessionsPerDay,
        startPage,
        endPage,
        focusIntervalSeconds,
        breakSeconds,
        gameBreakSeconds,
        allowGameBreak,
    } = req.body;

    // Ownership check + cannot edit completed tasks
    const { data: task, error: findError } = await supabaseAdmin
        .from('assigned_tasks').select('id, status')
        .eq('id', id).eq('assigned_by', parentId).is('deleted_at', null).single();

    if (findError || !task) { res.status(403).json({ error: 'Task not found or you do not have permission' }); return; }
    if (task.status === 'completed') { res.status(400).json({ error: 'Cannot edit a completed task' }); return; }

    const updatePayload: Record<string, any> = {};
    if (sessionDuration !== undefined) updatePayload.session_duration_minutes = sessionDuration;
    if (sessionsPerDay !== undefined) updatePayload.sessions_per_day = sessionsPerDay;
    if (startPage !== undefined) updatePayload.start_page = startPage;
    if (endPage !== undefined) updatePayload.end_page = endPage;
    if (focusIntervalSeconds !== undefined) updatePayload.focus_interval_seconds = focusIntervalSeconds;
    if (breakSeconds !== undefined) updatePayload.break_seconds = breakSeconds;
    if (gameBreakSeconds !== undefined) updatePayload.game_break_seconds = gameBreakSeconds;
    if (allowGameBreak !== undefined) updatePayload.allow_game_break = allowGameBreak;

    const { data, error } = await supabaseAdmin
        .from('assigned_tasks').update(updatePayload).eq('id', id).select().single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
});

// DELETE /tasks/:id — Soft delete
router.delete('/:id', validate(deleteTaskSchema), async (req, res) => {
    const { id } = req.params;
    const { parentId } = req.body;

    const { data: task } = await supabaseAdmin
        .from('assigned_tasks').select('id')
        .eq('id', id).eq('assigned_by', parentId).is('deleted_at', null).single();

    if (!task) { res.status(403).json({ error: 'Task not found or you do not have permission' }); return; }

    const { error } = await supabaseAdmin
        .from('assigned_tasks').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true, message: 'Task soft-deleted successfully' });
});

// PATCH /tasks/:id/status
router.patch('/:id/status', validate(patchStatusSchema), async (req, res) => {
    const { id } = req.params;
    const { status, childId } = req.body;

    const { data: task } = await supabaseAdmin
        .from('assigned_tasks').select('id').eq('id', id).eq('child_id', childId).is('deleted_at', null).single();
    if (!task) { res.status(403).json({ error: 'Task not found or you do not have permission' }); return; }

    const { data, error } = await supabaseAdmin
        .from('assigned_tasks').update({ status }).eq('id', id).select().single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
});

export default router;
