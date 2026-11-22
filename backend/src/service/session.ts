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
        await sessionRepository.revoke(sessionId);
        await sessionCacheRepository.delete([sessionId]).catch((err) => {
            console.error('❌ Session cache delete failed:', err.message);
            return null;
        });
    },

    async revokeAllByUser(userId: string): Promise<void> {
        const sessionIds = await sessionRepository.revokeAllByUserId(userId);
        await sessionCacheRepository.delete(sessionIds).catch((err) => {
            console.error('❌ Session cache delete failed:', err.message);
            return null;
        });
    }
};