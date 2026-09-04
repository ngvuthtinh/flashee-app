import express from 'express';
import cors from 'cors';
import './config/db';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';

const app = express();
const PORT = process.env['PORT'] ?? 3000;

app.use(cors());

// Middleware parse JSON body
app.use(express.json());

// Health check route - test server còn sống không
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
