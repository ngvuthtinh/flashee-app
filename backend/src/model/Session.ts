export interface Session {
    id: string;
    user_id: string;
    user_agent: string | null;
    revoked_at: Date | null;
    created_at: Date;
    updated_at: Date;
}