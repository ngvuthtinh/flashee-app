import { v7 as uuidv7 } from 'uuid'; // Import UUID v7
import pool from'../config/db';
import { User, RegisterDTO } from '../model/User';

export const userRepository = {
    async findByEmail(email: string): Promise<User | null> {
        const query = `SELECT * FROM users WHERE email_address = $1 LIMIT 1;`;
        const result = await pool.query<User>(query, [email]);
        return result.rows[0] || null;
    },

    async create(data: RegisterDTO & { passwordHash: string }): Promise<User> {
        const userId = uuidv7();
        const defaultRole = 'CUSTOMER';

        const query = `INSERT INTO users (id,
                                            user_name,
                                            email_address,
                                            phone_number,
                                            password,
                                            role,
                                            created_at)
                                            VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *;`;

        const values = [userId, data.user_name, data.email_address, data.phone_number, data.passwordHash, defaultRole];
        const result = await pool.query<User>(query,values);
        return result.rows[0]!;
    },

    async findById(userId: string): Promise<User | null> {
        const query = `SELECT * FROM users WHERE id = $1 LIMIT 1;`;
        const result = await pool.query<User>(query, [userId]);
        return result.rows[0] || null;
    },
}
