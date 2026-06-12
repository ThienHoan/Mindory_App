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
import miniGameRoutes from './routes/miniGames';
import aiQuizRoutes from './routes/ai-quiz';
import aiAssignmentRoutes from './routes/ai-assignments';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const normalizeOrigin = (value: string) => value.trim().replace(/\/+$/, '');

// App Platform sits behind a reverse proxy, so trust the forwarded client IP.
app.set('trust proxy', 1);

// ---- Security Middleware ----
const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(normalizeOrigin).filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:3001']

app.use(helmet()); // Set secure HTTP headers
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            callback(null, true)
            return
        }

        const normalizedOrigin = normalizeOrigin(origin)

        if (allowedOrigins.includes(normalizedOrigin)) {
            callback(null, true)
            return
        }

        console.error(`CORS rejected origin: ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`)

        callback(new Error('Not allowed by CORS'))
    },
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
app.use(rewardRoutes);
app.use('/mini-games', miniGameRoutes);
app.use('/ai-quiz', aiQuizRoutes);
app.use('/ai-assignments', aiAssignmentRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Mindory API is running', version: '1.0.0' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;
