import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// POST /sessions/start - Bé bắt đầu học 1 task
router.post('/start', async (req, res) => {
    const { taskId, childId } = req.body;
    if (!taskId || !childId) {
        res.status(400).json({ error: 'Missing required fields: taskId, childId' });
        return;
    }

    try {
        // Kiểm tra task tồn tại và chưa hoàn thành
        const { data: task, error: taskError } = await supabaseAdmin
            .from('assigned_tasks')
            .select('id, status')
            .eq('id', taskId)
            .eq('child_id', childId)
            .single();

        if (taskError || !task) {
            res.status(404).json({ error: 'Task not found or not assigned to this child' });
            return;
        }

        if (task.status === 'completed') {
            res.status(400).json({ error: 'Task is already completed' });
            return;
        }

        // Tạo learning session mới
        const { data: session, error: sessionError } = await supabaseAdmin
            .from('learning_sessions')
            .insert({ task_id: taskId, child_id: childId })
            .select()
            .single();

        if (sessionError) throw sessionError;

        // Cập nhật task status -> in_progress
        await supabaseAdmin
            .from('assigned_tasks')
            .update({ status: 'in_progress' })
            .eq('id', taskId)
            .eq('status', 'pending'); // Chỉ update nếu còn pending

        res.status(201).json(session);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /sessions/:id/finish - Bé nộp bài học
router.post('/:id/finish', async (req, res) => {
    const { id } = req.params;
    const { childId, quizScore, quizTotal } = req.body;

    if (!childId) {
        res.status(400).json({ error: 'Missing required field: childId' });
        return;
    }

    try {
        // Kiểm tra session tồn tại và chưa hoàn thành (idempotency guard)
        const { data: session, error: findError } = await supabaseAdmin
            .from('learning_sessions')
            .select('id, task_id, completed, started_at')
            .eq('id', id)
            .eq('child_id', childId)
            .single();

        if (findError || !session) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        if (session.completed) {
            res.status(400).json({ error: 'Session already completed' });
            return;
        }

        // Tính focus_minutes chính xác từ started_at
        const startedAt = new Date(session.started_at);
        const endedAt = new Date();
        const focusMinutes = Math.round((endedAt.getTime() - startedAt.getTime()) / 60000);

        // Cập nhật session
        const { data: updatedSession, error: updateError } = await supabaseAdmin
            .from('learning_sessions')
            .update({
                ended_at: endedAt.toISOString(),
                focus_minutes: focusMinutes,
                quiz_score: quizScore ?? null,
                quiz_total: quizTotal ?? null,
                completed: true,
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        // Cập nhật task status -> completed
        await supabaseAdmin
            .from('assigned_tasks')
            .update({ status: 'completed' })
            .eq('id', session.task_id);

        // Auto-create reward (logic: score >= 70% -> game, còn lại -> music)
        let rewardType = 'music';
        if (quizScore !== undefined && quizTotal !== undefined && quizTotal > 0) {
            const ratio = quizScore / quizTotal;
            if (ratio >= 0.7) rewardType = 'game';
        }

        const { data: reward, error: rewardError } = await supabaseAdmin
            .from('rewards')
            .insert({
                session_id: id,
                reward_type: rewardType,
                duration_seconds: rewardType === 'game' ? 300 : 120,
            })
            .select()
            .single();

        if (rewardError) {
            console.error('Failed to create reward:', rewardError);
        }

        res.json({ session: updatedSession, reward: reward ?? null });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /sessions/mine - Child: Lấy lịch sử học của bé (childId từ body, không phải param)
router.get('/mine', async (req, res) => {
    const { childId } = req.query;
    if (!childId) {
        res.status(400).json({ error: 'Missing required query param: childId' });
        return;
    }

    const { data, error } = await supabaseAdmin
        .from('learning_sessions')
        .select('*, assigned_tasks(lesson_id, lessons(title))')
        .eq('child_id', String(childId))
        .order('created_at', { ascending: false });

    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    res.json(data);
});

// GET /sessions/stats?parentId=... - Parent: Tổng hợp thống kê học tập của các con
router.get('/stats', async (req, res) => {
    const { parentId } = req.query;
    if (!parentId) {
        res.status(400).json({ error: 'Missing required query param: parentId' });
        return;
    }

    try {
        // Lấy danh sách ID của tất cả con thuộc parent
        const { data: children, error: childrenError } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name')
            .eq('parent_id', String(parentId))
            .eq('role', 'child');

        if (childrenError) throw childrenError;
        if (!children || children.length === 0) {
            res.json({ children: [], avgFocusMinutes: 0, avgQuizScore: 0 });
            return;
        }

        const childIds = children.map((c) => c.id);

        // Lấy tất cả sessions của các con
        const { data: sessions, error: sessionsError } = await supabaseAdmin
            .from('learning_sessions')
            .select('child_id, focus_minutes, quiz_score, quiz_total, completed')
            .in('child_id', childIds)
            .eq('completed', true);

        if (sessionsError) throw sessionsError;

        // Tính toán thống kê
        const totalSessions = sessions?.length ?? 0;
        const avgFocusMinutes = totalSessions > 0
            ? Math.round(sessions!.reduce((sum, s) => sum + (s.focus_minutes ?? 0), 0) / totalSessions)
            : 0;

        const scoredSessions = sessions?.filter(s => s.quiz_total > 0) ?? [];
        const avgQuizScore = scoredSessions.length > 0
            ? Math.round(
                scoredSessions.reduce((sum, s) => sum + (s.quiz_score / s.quiz_total) * 100, 0) / scoredSessions.length
            )
            : 0;

        res.json({
            children,
            totalSessions,
            avgFocusMinutes,
            avgQuizScore,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
