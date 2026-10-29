import pool from '../config/db';
import { Db } from '../database/transaction';

export const revokedTokenRepository = {
    async add(jti: string, expiresAt: Date, db: Db = pool): Promise<void> {
        const query = `INSERT INTO revoked_tokens (jti, expires_at) VALUES ($1, $2)
                       ON CONFLICT (jti) DO NOTHING;`;
        await db.query(query, [jti, expiresAt]);
    },

    async exists(jti: string, db: Db = pool): Promise<boolean> {
        const result = await db.query(`SELECT 1 FROM revoked_tokens WHERE jti = $1 LIMIT 1;`, [jti]);
        return (result.rowCount ?? 0) > 0;
    },
};
