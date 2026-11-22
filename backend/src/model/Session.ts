export interface Session {
    id: string;
    user_id: string;
    user_agent: string | null;
    revoked_at: Date | null;
    created_at: Date;
    updated_at: Date;
    token_hash: string;
    previous_token_hash: string | null;
    token_issued_at: Date;
    expires_at: Date;
}