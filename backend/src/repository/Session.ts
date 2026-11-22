import { v7 as uuidv7 } from 'uuid';
import pool from '../config/db';
import { Db } from '../database/transaction';
import { Session } from '../model/Session';

export const sessionRepository = {
    async create(data: { userId: string; userAgent: string | null; tokenHash: string; expiresAt: Date }, db: Db = pool): Promise<Session> {
        const query = `INSERT INTO sessions (id, user_id, user_agent, token_hash, token_issued_at, expires_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`;
        const values = [uuidv7(), data.userId, data.userAgent, data.tokenHash, new Date(), data.expiresAt];
        const result = await db.query<Session>(query, values);
        return result.rows[0]!;
    },

    async findByTokenHash(tokenHash: string, db: Db = pool): Promise<Session | null> {
        const result = await db.query<Session>(`SELECT * FROM sessions WHERE token_hash = $1 LIMIT 1;`, [tokenHash]);
        return result.rows[0] || null;
    },

    async findByPreviousTokenHash(tokenHash: string, db: Db = pool): Promise<Session | null> {
        const result = await db.query<Session>(`SELECT * FROM sessions WHERE previous_token_hash = $1 LIMIT 1;`, [tokenHash]);
        return result.rows[0] || null;
    },

    async rotate(id: string, oldHash: string, newHash: string, expiresAt: Date, db: Db = pool): Promise<boolean> {
        const query = `UPDATE sessions
                   SET previous_token_hash = token_hash, token_hash = $3, token_issued_at = $4, expires_at = $5
                   WHERE id = $1 AND token_hash = $2 AND revoked_at IS NULL;`;
        const result = await db.query(query, [id, oldHash, newHash, new Date(), expiresAt]);
        return result.rowCount === 1;
    },

    async findActiveById(id: string, db: Db = pool): Promise<Session | null> {
        const query = `SELECT * FROM sessions WHERE id = $1 AND revoked_at IS NULL LIMIT 1;`;
        const result = await db.query<Session>(query, [id]);
        return result.rows[0] || null;
    },

    async revoke(id: string, db: Db = pool): Promise<void> {
        const query = `UPDATE sessions SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL;`;
        await db.query(query, [id]);
    },

    async revokeAllByUserId(userId: string, db: Db = pool): Promise<string[]> {
        const query = `UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL RETURNING id;`;
        const result = await db.query<{ id: string }>(query, [userId]);
        return result.rows.map((row) => row.id);
    },

    async deleteDead(now: Date, revokedRetentionDays: number, db: Db = pool): Promise<number> {
        const query = `DELETE FROM sessions WHERE expires_at < $1 OR revoked_at < NOW() - make_interval(days => $2);`;
        const result = await db.query(query, [now, revokedRetentionDays])
        return result.rowCount ?? 0;
    }
}