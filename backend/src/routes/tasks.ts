import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// Create Task
router.post('/', async (req, res) => {
    const { childId, lessonId, sessionDuration, sessionsPerDay, startPage, endPage, parentId } = req.body;

    try {
        const { data, error } = await supabaseAdmin
            .from('assigned_tasks')
            .insert({
                child_id: childId,
                lesson_id: lessonId,
                assigned_by: parentId, // Need to verify if this parentId is valid via middleware
                session_duration_minutes: sessionDuration,
                sessions_per_day: sessionsPerDay,
                start_page: startPage,
                end_page: endPage,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
