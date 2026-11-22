import { sessionRepository } from '../repository/Session';
import pool from '../config/db'

const REVOKED_RETENTION_DAYS = Number(process.env['CLEANUP_REVOKED_RETENTION_DAYS'] ?? 7);
const CLEANUP_LOCK_ID = 727001;

async function runCleanup(): Promise<number> {
    const removed = await sessionRepository.deleteDead(new Date(), REVOKED_RETENTION_DAYS);
    console.log(`🧹 Cleanup: removed ${removed} dead sessions`);
    return removed;
}

async function runExclusive(): Promise<number | null> {
    const client = await pool.connect();
    try {
        const { rows } = await client.query<{ locked: boolean }>('SELECT pg_try_advisory_lock($1) AS locked', [CLEANUP_LOCK_ID]);
        if (!rows[0]!.locked) {
            console.log('⏭️ Cleanup skipped: another run holds the lock');
            return null;
        }
        try {
            return await runCleanup();
        } finally {
            await client.query('SELECT pg_advisory_unlock($1)', [CLEANUP_LOCK_ID]);
        }
    } finally {
        client.release();
    }
}

export const cleanupService = { run: runExclusive };