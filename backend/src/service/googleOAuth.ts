import crypto from 'crypto';
import { googleConfig } from '../config/google';

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
    }
}