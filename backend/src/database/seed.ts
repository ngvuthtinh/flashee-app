import fs from 'fs';
import path from 'path';
import pool from '../config/db';

const SEEDS_DIR = path.join(__dirname, 'seeds');

async function seed() {
    const files = fs
        .readdirSync(SEEDS_DIR)
        .filter((f) => f.endsWith('.sql'))
        .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const file of files) {
            const sql = fs.readFileSync(path.join(SEEDS_DIR, file), 'utf8');
            await client.query(sql);
            console.log(`▶ ${file}`);
        }
        await client.query('COMMIT');
        console.log('✅ Seed thành công!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Seed lỗi, đã rollback:', error);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
