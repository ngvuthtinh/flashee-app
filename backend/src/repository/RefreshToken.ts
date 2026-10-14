import { v7 as uuidv7 } from 'uuid';
import pool from '../config/db';
import { Db } from '../database/transaction';
import { RefreshToken } from '../model/RefreshToken';

export const refreshTokenRepository = {
    async create(data: {
        userId: string;
        tokenHash: string;
        userAgent: string | null;
        expiresAt: Date;
    }, db: Db = pool): Promise<RefreshToken> {
        const query = `INSERT INTO refresh_tokens (id, user_id, token_hash, user_agent, expires_at)
                       VALUES ($1, $2, $3, $4, $5) RETURNING *;`;
        const values = [uuidv7(), data.userId, data.tokenHash, data.userAgent, data.expiresAt];
        const result = await db.query<RefreshToken>(query, values);
        return result.rows[0]!;
    },

    async findByHash(tokenHash: string): Promise<RefreshToken | null> {
        const query = `SELECT * FROM refresh_tokens WHERE token_hash = $1 LIMIT 1;`;
        const result = await pool.query<RefreshToken>(query, [tokenHash]);
        return result.rows[0] || null;
    },

    async revoke(id: string, db: Db = pool): Promise<void> {
        const query = `UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1;`;
        await db.query(query, [id]);
    },

    async revokeAllByUserId(userId: string, db: Db = pool): Promise<void> {
        const query = `UPDATE refresh_tokens SET revoked_at = NOW()
                       WHERE user_id = $1 AND revoked_at IS NULL;`;
        await db.query(query, [userId]);
    }
}