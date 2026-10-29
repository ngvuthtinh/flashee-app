import { CookieOptions } from 'express';

export const REFRESH_COOKIE = 'refresh_token';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Dùng cho CẢ đặt lẫn xoá: name + path phải khớp thì trình duyệt mới xoá đúng cookie
const refreshCookieBase: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env['NODE_ENV'] === 'production',
    path: '/api/auth',
};

export const refreshCookieOptions: CookieOptions = { ...refreshCookieBase, maxAge: THIRTY_DAYS_MS };
export const clearRefreshCookieOptions: CookieOptions = refreshCookieBase;
