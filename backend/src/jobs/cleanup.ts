import pool from '../config/db';
import { cleanupService } from '../service/cleanup';

async function main(): Promise<void> {
    try {
        await cleanupService.run();
    } catch (err) {
        console.error('❌ Cleanup failed:', err);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

main();