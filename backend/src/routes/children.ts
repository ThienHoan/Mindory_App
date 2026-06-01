import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// Create Child
router.post('/', async (req, res) => {
    const { email, password, fullName, parentId, grade } = req.body;
    const normalizedGrade = grade !== undefined ? Number(grade) : null;

    if (normalizedGrade !== null && (!Number.isInteger(normalizedGrade) || normalizedGrade < 1 || normalizedGrade > 5)) {
        res.status(400).json({ error: 'Grade must be an integer between 1 and 5' });
        return;
    }


    try {
        // 1. Create User
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                role: 'child',
                parent_id: parentId,
                grade: normalizedGrade,
            }
        });

        if (createError) throw createError;
        if (!newUser.user) throw new Error('Failed to create user');

        // 2. Persist profile explicitly to avoid DB defaults setting role=parent
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert(
                {
                    id: newUser.user.id,
                    email,
                    full_name: fullName,
                    role: 'child',
                    parent_id: parentId,
                    grade: normalizedGrade,
                },
                { onConflict: 'id' }
            );

        if (profileError) {
            throw profileError;
        }

        res.json({ success: true, user: newUser.user });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Get Children for Parent
router.get('/', async (req, res) => {
    const { parentId } = req.query;

    if (!parentId) {
        res.status(400).json({ error: 'Missing parentId' });
        return;
    }

    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('parent_id', parentId)
        .eq('role', 'child');

    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }

    res.json(data);
});

// Update Child (grade)
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { parentId, grade } = req.body;

    if (!parentId) {
        res.status(400).json({ error: 'Missing parentId' });
        return;
    }

    const normalizedGrade = grade !== undefined ? Number(grade) : undefined;

    if (normalizedGrade !== undefined && (!Number.isInteger(normalizedGrade) || normalizedGrade < 1 || normalizedGrade > 5)) {
        res.status(400).json({ error: 'Grade must be an integer between 1 and 5' });
        return;
    }

    try {
        const { data: childProfile, error: childError } = await supabaseAdmin
            .from('profiles')
            .select('id, parent_id')
            .eq('id', id)
            .single();

        if (childError || !childProfile) {
            res.status(404).json({ error: 'Child not found' });
            return;
        }

        if (childProfile.parent_id !== parentId) {
            res.status(403).json({ error: 'Not allowed to update this child' });
            return;
        }

        const updatePayload: Record<string, unknown> = {};
        if (normalizedGrade !== undefined) {
            updatePayload.grade = normalizedGrade;
        }

        if (Object.keys(updatePayload).length === 0) {
            res.status(400).json({ error: 'No fields to update' });
            return;
        }

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update(updatePayload)
            .eq('id', id)
            .select('id, full_name, grade')
            .single();

        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }

        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
