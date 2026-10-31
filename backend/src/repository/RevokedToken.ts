import redis from '../config/redis';

const key = (jti: string) => `revoked:${jti}`;

export const revokedTokenRepository = {
    async add(jti: string, expiresAt: Date): Promise<void> {
        const ttlSeconds = Math.ceil((expiresAt.getTime() - Date.now()) / 1000);
        if (ttlSeconds <= 0) return;
        await redis.set(key(jti), '1', { EX: ttlSeconds });
    },

    async exists(jti: string): Promise<boolean> {
         return (await redis.exists(key(jti))) === 1;
    },
};
