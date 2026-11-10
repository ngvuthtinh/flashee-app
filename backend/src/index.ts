import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import './config/db';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import { googleConfig } from './config/google';
import redis from './config/redis';
import { cleanupService } from './service/cleanup';

const app = express();
const PORT = process.env['PORT'] ?? 3000;

app.use(cors({ origin: googleConfig.frontendUrl, credentials: true }));

// Middleware parse JSON body
app.use(express.json());
//Midleware parse Cookie
app.use(cookieParser());
// Health check route - checks that the server is still alive
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use(errorHandler);

async function start() {
  await redis.connect();
  console.log('✅ Redis connected successfully');

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });

  cleanupService.start();
}

start().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});