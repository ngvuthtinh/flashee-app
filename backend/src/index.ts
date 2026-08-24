import express from 'express';
import './config/db';

const app = express();
const PORT = process.env['PORT'] ?? 3000;

// Middleware parse JSON body
app.use(express.json());

// Health check route - test server còn sống không
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
