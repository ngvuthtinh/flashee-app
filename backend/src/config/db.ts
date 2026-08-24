import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }
  return value;
}

const pool = new Pool({
  host: requireEnv('DB_HOST'),
  port: Number(requireEnv('DB_PORT')),
  user: requireEnv('DB_USER'),
  password: requireEnv('DB_PASSWORD'),
  database: requireEnv('DB_NAME'),

  // Tối đa 10 connection đồng thời trong pool
  max: 10,

  // Nếu connection chờ quá 30s mà không được dùng → bị đóng
  idleTimeoutMillis: 30_000,

  // Nếu chờ connection từ pool quá 5s → throw error thay vì chờ mãi
  connectionTimeoutMillis: 5_000,
});

// Kiểm tra kết nối khi khởi động server
// _client: prefix _ = quy ước "biết là có nhưng không dùng" → tắt cảnh báo noUnusedParameters
pool.connect((err, _client, release) => {
  if (err) {
    console.error('❌ Failed to connect to PostgreSQL:', err.message);
    return;
  }
  console.log('✅ PostgreSQL connected successfully');
  release(); // Trả connection ngay về pool sau khi test xong
});

export default pool;
