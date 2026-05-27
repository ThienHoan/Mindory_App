import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';

// Valid roles — whitelist to prevent unknown claim values escalating privileges
const VALID_ROLES = ['admin', 'parent', 'child'] as const;
type ValidRole = typeof VALID_ROLES[number];

function normalizeRole(raw: unknown, fallback: ValidRole = 'parent'): ValidRole {
    if (typeof raw === 'string' && (VALID_ROLES as readonly string[]).includes(raw)) {
        return raw as ValidRole;
    }
    // Unknown claim value: log warning and fallback to least-privileged role
    console.warn(`[auth] Unknown role value: "${raw}", falling back to "${fallback}"`);
    return fallback;
}

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: ValidRole;
            };
        }
    }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid Authorization header' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify the JWT with Supabase
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            res.status(401).json({ error: 'Invalid or expired token' });
            return;
        }

        // Priority 1: Read role from JWT app_metadata (zero extra DB query)
        // app_metadata is set via Supabase Admin API: updateUserById(id, { app_metadata: { role } })
        const claimRole = user.app_metadata?.role;
        if (claimRole !== undefined && claimRole !== null) {
            req.user = {
                id: user.id,
                email: user.email ?? '',
                role: normalizeRole(claimRole),
            };
            return next();
        }

        // Priority 2: Fallback — query profiles table (for users not yet seeded via Admin API)
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        req.user = {
            id: user.id,
            email: user.email ?? '',
            role: normalizeRole(profile?.role),
        };

        next();
    } catch (err) {
        res.status(401).json({ error: 'Authentication failed' });
    }
}
