import { v7 as uuidv7 } from 'uuid';
import { OAuthAccount } from "../model/OAuthAccount";
import pool from '../config/db';
import { Db } from '../database/transaction';

export const oauthAccountRepository = {
    async findByProviderUser(provider: string, providerUserId: string, db: Db = pool): Promise<OAuthAccount | null> {
        const query = `SELECT * FROM oauth_accounts WHERE provider = $1 AND provider_user_id = $2 LIMIT 1;`;
        const result = await db.query<OAuthAccount>(query, [provider, providerUserId]);
        return result.rows[0] || null;
    },

    async create(data: { userId: string, provider: string, providerUserId: string }, db: Db = pool): Promise<OAuthAccount> {
        const query = `INSERT INTO oauth_accounts (id, user_id, provider, provider_user_id) VALUES ($1, $2, $3, $4) RETURNING *;`;
        const values = [uuidv7(), data.userId, data.provider, data.providerUserId];
        const result = await db.query<OAuthAccount>(query, values);
        return result.rows[0]!;
    }
}