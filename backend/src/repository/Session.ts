import { v7 as uuidv7 } from 'uuid';
import pool from '../config/db';
import { Db } from '../database/transaction';
import { Session } from '../model/Session';

export const sessionRepository = {
    async create(data: { userId: string; userAgent: string | null }, db: Db = pool): Promise<Session> {
        const query = `INSERT INTO sessions (id, user_id, user_agent) VALUES ($1, $2, $3) RETURNING *;`;
        const result = await db.query<Session>(query, [uuidv7(), data.userId, data.userAgent]);
        return result.rows[0]!;
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
        const query = `DELETE FROM sessions s WHERE s.revoked_at < NOW() - make_interval(days => $2)
                       OR NOT EXISTS (SELECT 1 FROM refresh_tokens t WHERE t.session_id = s.id AND t.expires_at > $1);`;
        const result = await db.query(query, [now, revokedRetentionDays])
        return result.rowCount ?? 0;
    }
}