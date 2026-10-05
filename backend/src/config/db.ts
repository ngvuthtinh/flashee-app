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

  // Maximum of 10 concurrent connections in the pool
  max: 10,

  // Close a connection that has sat idle (unused) for more than 30s
  idleTimeoutMillis: 30_000,

  // Throw an error instead of waiting forever if no connection is available within 5s
  connectionTimeoutMillis: 5_000,
});

// Verify the database connection on server startup
// _client: the "_" prefix marks an intentionally unused parameter, silencing the noUnusedParameters error
pool.connect((err, _client, release) => {
  if (err) {
    console.error('❌ Failed to connect to PostgreSQL:', err.message);
    return;
  }
  console.log('✅ PostgreSQL connected successfully');
  release(); // Return the connection to the pool right after the check
});

export default pool;
