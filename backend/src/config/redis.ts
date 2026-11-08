import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env['REDIS_URL'];
if (!url) {
    throw new Error ('❌ Missing required environment variable: REDIS_URL');
}

const redis = createClient({ url, disableOfflineQueue: true });

redis.on('error', (err) => console.error('❌ Redis error:', err.message));

export default redis;
