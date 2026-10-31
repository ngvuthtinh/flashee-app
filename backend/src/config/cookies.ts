import { CookieOptions } from 'express';

// Refresh Cookie
export const REFRESH_COOKIE = 'refresh_token';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const refreshCookieBase: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env['NODE_ENV'] === 'production',
    path: '/api/auth',
};

export const refreshCookieOptions: CookieOptions = { ...refreshCookieBase, maxAge: THIRTY_DAYS_MS };
export const clearRefreshCookieOptions: CookieOptions = refreshCookieBase;

// Oauth Cookie
export const OAUTH_STATE_COOKIE = 'oauth_state';
export const OAUTH_LINK_COOKIE = 'oauth_link';
const TEN_MINUTES_MS = 10 * 60 * 1000;

const oauthCookieBase: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env['NODE_ENV'] === 'production',
    path: '/api/auth/google',
};

export const oauthCookieOptions: CookieOptions = { ...oauthCookieBase, maxAge: TEN_MINUTES_MS};
export const clearOauthCookieOptions: CookieOptions = oauthCookieBase;