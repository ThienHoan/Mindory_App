import { Router } from 'express';

const router = Router();

router.get('/me', (req, res) => {
    res.send('Auth route');
});

export default router;
