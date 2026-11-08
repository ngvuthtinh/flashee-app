import { withTransaction } from '../database/transaction';
import { refreshTokenRepository } from '../repository/RefreshToken';
import { sessionRepository } from '../repository/Session';
import { sessionCacheRepository } from '../repository/SessionCache';

export const sessionService = {
    async isActive(sessionId: string, userId: string): Promise<boolean> {
        const cachedUserId = await sessionCacheRepository.get(sessionId).catch((err) => {
            console.error('❌ Session cache read failed:', err.message);
            return null;
        });
        if (cachedUserId) return cachedUserId === userId;

        const session = await sessionRepository.findActiveById(sessionId);
        if (!session || session.user_id !== userId) return false;

        await sessionCacheRepository.set(sessionId, userId).catch((err) => {
            console.error('❌ Session cache write  failed:', err.message);
            return null;
        });
        return true;
    },

    async revoke(sessionId: string): Promise<void> {
        await withTransaction(async (client) => {
            await sessionRepository.revoke(sessionId, client);
            await refreshTokenRepository.revokeAllBySessionId(sessionId, client);
        });
        await sessionCacheRepository.delete([sessionId]).catch((err) => {
            console.error('❌ Session cache delete failed:', err.message);
            return null;
        });
    },

    async revokeAllByUser(userId: string): Promise<void> {
        const sessionIds = await withTransaction(async (client) => {
            const ids = await sessionRepository.revokeAllByUserId(userId, client);
            await refreshTokenRepository.revokeAllByUserId(userId, client);
            return ids;
        });
        await sessionCacheRepository.delete(sessionIds).catch((err) => {
            console.error('❌ Session cache delete failed:', err.message);
            return null;
        });
    }
};