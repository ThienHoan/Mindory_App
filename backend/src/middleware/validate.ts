import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Reusable Zod validation middleware.
 * Validates req.body against the given schema.
 * Replaces req.body with the sanitized/parsed result.
 * 
 * Usage: router.put('/:id', validate(updateTaskSchema), handler)
 */
export const validate = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ error: result.error.flatten().fieldErrors });
            return;
        }
        req.body = result.data; // Replace with sanitized data
        next();
    };
};
