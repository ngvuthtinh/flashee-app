import { v7 as uuidv7 } from 'uuid'; 
import pool from'../config/db';
import { Db } from '../database/transaction';
import { User, RegisterDTO } from '../model/User';

export const userRepository = {
    async findByEmail(email: string, db: Db = pool): Promise<User | null> {
        const query = `SELECT * FROM users WHERE email_address = $1 LIMIT 1;`;
        const result = await db.query<User>(query, [email]);
        return result.rows[0] || null;
    },

    async create(data: RegisterDTO & { passwordHash: string }, db: Db = pool): Promise<User> {
        const userId = uuidv7();
        const defaultRole = 'CUSTOMER';

        const query = `INSERT INTO users (id,
                                            user_name,
                                            email_address,
                                            phone_number,
                                            password,
                                            role)
                                            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`;

        const values = [userId, data.user_name, data.email_address, data.phone_number, data.passwordHash, defaultRole];
        const result = await db.query<User>(query,values);
        return result.rows[0]!;
    },

    async findById(userId: string, db: Db = pool): Promise<User | null> {
        const query = `SELECT * FROM users WHERE id = $1 LIMIT 1;`;
        const result = await db.query<User>(query, [userId]);
        return result.rows[0] || null;
    },

    async createOAuthUser(data: { userName: string, email: string }, db: Db = pool): Promise<User> {
        const query = `INSERT INTO users (id, user_name, email_address, role) VALUES ($1, $2, $3, 'CUSTOMER') RETURNING *;`;
        const values = [uuidv7(), data.userName, data.email];
        const result = await db.query<User>(query, values);
        return result.rows[0]!;
    }
}
