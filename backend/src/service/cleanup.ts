import { sessionRepository } from '../repository/Session';
import { refreshTokenRepository } from '../repository/RefreshToken';

const CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000;
const REVOKED_RETENTION_DAYS = 7;

async function runCleanup(): Promise<void> {
    const now = new Date();
    const sessions = await sessionRepository.deleteDead(now, REVOKED_RETENTION_DAYS);
    const tokens = await refreshTokenRepository.deleteExpired(now);
    if (sessions > 0 || tokens > 0) {
        console.log(`🧹 Cleanup: removed ${sessions} dead sessions, ${tokens} expired refresh tokens`);
    }
}

export const cleanupService = {
    run: runCleanup,

    start(): void {
        const tick = () => runCleanup().catch((err) => console.error('❌ Cleanup failed:', err));
        tick();
        setInterval(tick, CLEANUP_INTERVAL_MS).unref();
    },
};