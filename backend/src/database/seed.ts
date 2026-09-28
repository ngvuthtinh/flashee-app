import bcrypt from 'bcryptjs';
import { v7 as uuidv7 } from 'uuid';
import pool from '../config/db';

async function seed() {
    await pool.query('BEGIN');
    try {
        await pool.query(`
            INSERT INTO countries (id, country_name, country_code)
            VALUES
                ($1, 'Vietnam', '+84'),
                ($2, 'United States', '+1')
            ON CONFLICT (country_code) DO NOTHING;`, [uuidv7(), uuidv7()]);

        const passwordHash = await bcrypt.hash('password123', 10);
        await pool.query(`
            INSERT INTO users (id, user_name, email_address, phone_number, password, role, created_at)
            VALUES
                ($1, 'Admin User', 'admin@flashee.dev', '0900000001', $4, 'ADMIN', NOW()),
                ($2, 'Test Customer', 'customer@flashee.dev', '0900000002', $4, 'CUSTOMER', NOW()),
                ($3, 'Another Customer', 'customer2@flashee.dev', '0900000003', $4, 'CUSTOMER', NOW())
            ON CONFLICT (email_address) DO NOTHING;`, [uuidv7(), uuidv7(), uuidv7(), passwordHash]);

        await pool.query('COMMIT');
        console.log('✅ Seed thành công!');
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('❌ Seed lỗi:', error);
    } finally {
        await pool.end();
    }
}

seed();
