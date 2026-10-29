import crypto from 'crypto';
import { googleConfig } from '../config/google';
import { URLSearchParams } from 'url';
import { AppError } from '../errors/AppError';

export type GoogleProfile = {
    sub: string;
    email: string;
    emailVerified: boolean;
    name: string | null;
};

export const googleOAuthService = {
    generateState(): string {
        return crypto.randomBytes(32).toString('hex');
    },

    buildAuthUrl(state: string): string {
        const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        url.search = new URLSearchParams({
            client_id: googleConfig.clientId,
            redirect_uri: googleConfig.redirectUri,
            response_type: 'code',
            scope: 'openid email profile',
            state,
            prompt: 'select_account',
        }).toString();
        return url.toString();
    },

    async exchangeCode(code: string): Promise<GoogleProfile> {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: googleConfig.clientId,
                client_secret: googleConfig.clientSecret,
                redirect_uri: googleConfig.redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        if (!tokenRes.ok) throw AppError.badRequest('Google authorization failed');
        const { access_token } = (await tokenRes.json() as { access_token?: string });
        if (!access_token) throw AppError.badRequest('Google authorization failed');

        const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        if (!infoRes.ok) throw AppError.badRequest('Google authorization failed');
        const info = (await infoRes.json()) as { sub?: string; email?: string; email_verified?: boolean; name?: string };
        if (!info.sub || !info.email) throw AppError.badRequest('Google authorization failed');

        return { sub: info.sub, email: info.email, emailVerified: info.email_verified === true, name: info.name ?? null };
    },
}

