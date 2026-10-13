export type RefreshToken = {
    id: string;
    user_id: string;
    token_hash: string;
    user_agent: string | null;
    expires_at: Date;
    revoked_at: Date | null;
    created_at: Date;
    updated_at: Date;
};