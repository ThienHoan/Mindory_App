import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import childRoutes from './routes/children';
import taskRoutes from './routes/tasks';
import subjectRoutes from './routes/subjects';
import lessonRoutes from './routes/lessons';
import quizRoutes from './routes/quizzes';
import sessionRoutes from './routes/sessions';
import rewardRoutes from './routes/rewards';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ---- Security Middleware ----
app.use(helmet()); // Set secure HTTP headers
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));

// Rate limiting: max 100 requests per 15 minutes per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

app.use(express.json());

// ---- Routes ----
app.use('/auth', authRoutes);
app.use('/children', childRoutes);
app.use('/tasks', taskRoutes);
app.use('/subjects', subjectRoutes);
app.use('/lessons', lessonRoutes);
app.use('/quizzes', quizRoutes);
app.use('/sessions', sessionRoutes);
app.use('/rewards', rewardRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Mindory API is running', version: '1.0.0' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;
