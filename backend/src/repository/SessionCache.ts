import redis from '../config/redis';

const SESSION_CACHE_TTL_SECONDS = 300;
const key = (sessionId: string) => `session:${sessionId}`;

export const sessionCacheRepository = {
    async get(sessionId: string): Promise<string | null> {
        return redis.get(key(sessionId));
    },

    async set(sessionId: string, userId: string): Promise<void>{
        await redis.set(key(sessionId), userId, { EX: SESSION_CACHE_TTL_SECONDS });
    },

    async delete(sessionIds: string[]): Promise<void> {
        if (sessionIds.length === 0) return ;
        await redis.del(sessionIds.map(key));
    }
}