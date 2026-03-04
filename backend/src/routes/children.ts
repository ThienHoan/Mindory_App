import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// Create Child
router.post('/', async (req, res) => {
    const { email, password, fullName, parentId } = req.body;

    try {
        // 1. Create User
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                role: 'child',
                parent_id: parentId
            }
        });

        if (createError) throw createError;
        if (!newUser.user) throw new Error('Failed to create user');

        // 2. Link Parent ID in Profiles
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ parent_id: parentId })
            .eq('id', newUser.user.id);

        if (updateError) {
            console.error('Failed to link parent:', updateError);
            // Continue but warn
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

export default router;
