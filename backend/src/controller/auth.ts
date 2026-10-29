import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { authService } from '../service/auth';
import { googleOAuthService } from '../service/googleOAuth';
import { googleConfig } from '../config/google';
import { AppError } from '../errors/AppError';
import { REFRESH_COOKIE, refreshCookieOptions, clearRefreshCookieOptions } from '../config/cookies';
import { readBearerToken } from '../middleware/auth';

function getUserAgent(req: Request): string | null {
    const userAgent = req.headers['user-agent'];
    return userAgent ? userAgent.slice(0, 255) : null;
}

function readRefreshToken(req: Request): { token: string; fromCookie: boolean } | null {
    const bodyToken = req.body?.refreshToken;
    if (typeof bodyToken === 'string' && bodyToken) return { token: bodyToken, fromCookie: false };

    const cookieToken = req.cookies?.[REFRESH_COOKIE];
    if (typeof cookieToken === 'string' && cookieToken) return { token: cookieToken, fromCookie: true };

    return null;
}


function safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}


export const authController = {
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const userAgent = getUserAgent(req);
            const result = await authService.register(req.body, userAgent);

            res.status(201).json({
                success: true,
                message: 'user registered successfully',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const userAgent = getUserAgent(req);
            const result = await authService.login(req.body, userAgent);

            res.status(200).json({
                success: true,
                message: 'Logged in successfully',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },

    async refresh(req: Request, res: Response, next: NextFunction) {
        try {
            const found = readRefreshToken(req);
            if (!found) throw AppError.unauthorized('Missing refresh token');

            const result = await authService.refresh(found.token, getUserAgent(req));

            if (found.fromCookie) {
                res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions);
                res.status(200).json({
                    success: true,
                    message: 'Token refreshed successfully',
                    data: { accessToken: result.accessToken },
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Token refreshed successfully',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },

    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            const found = readRefreshToken(req);
            await authService.logout(found?.token ?? null, readBearerToken(req));

            res.clearCookie(REFRESH_COOKIE, clearRefreshCookieOptions);
            res.status(200).json({ success: true, message: 'Logged out successfully' });
        } catch (error) {
            next(error);
        }
    },


    async me(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await authService.getMe(req.user!.userId);
            res.status(200).json({ success: true, data: { user } });
        } catch (error) {
            next(error);
        }
    },

    googleRedirect(_req: Request, res: Response) {
        const state = googleOAuthService.generateState();

        res.cookie('oauth_state', state, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env['NODE_ENV'] === 'production',
            maxAge: 10 * 60 * 1000,
            path: '/api/auth/google',
        });

        res.redirect(googleOAuthService.buildAuthUrl(state));
    },

    async googleCallback(req: Request, res: Response, next: NextFunction) {
        const { code, state, error } = req.query;
        const savedState = req.cookies?.oauth_state;
        res.clearCookie('oauth_state', { path: '/api/auth/google' });

        const fail = (reason: string) =>
            res.redirect(`${googleConfig.frontendUrl}/login?error=${encodeURIComponent(reason)}`);

        if (error) return fail('google_denied');
        if (typeof code !== 'string' || typeof state !== 'string' || typeof savedState !== 'string' || !safeEqual(state, savedState)) {
            return fail('invalid_state');
        }

        try {
            const profile = await googleOAuthService.exchangeCode(code);
            const { refreshToken } = await authService.loginWithGoogle(profile, getUserAgent(req));

            res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);

            res.redirect(googleConfig.frontendUrl);
        } catch (err) {
            if (err instanceof AppError) return fail(err.message);
            next(err);
        }
    },

}