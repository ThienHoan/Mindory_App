import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import childRoutes from './routes/children';
import taskRoutes from './routes/tasks';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/children', childRoutes);
app.use('/tasks', taskRoutes);

app.get('/', (req, res) => {
    res.send('Mindory API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
