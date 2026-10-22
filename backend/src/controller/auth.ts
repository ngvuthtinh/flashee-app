import { Request, Response, NextFunction } from 'express';
import { authService } from '../service/auth';

function getUserAgent(req: Request): string | null {
    const userAgent = req.headers['user-agent'];
    return userAgent ? userAgent.slice(0, 255) : null;
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
            const { refreshToken } = req.body;

            const userAgent = getUserAgent(req);
            const result = await authService.refresh(refreshToken, userAgent);

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
            const { refreshToken } = req.body;

            await authService.logout(refreshToken);

            res.status(200).json({
                success: true,
                message: 'Logged out successfully',
            });
        } catch (error) {
            next(error);
        }
    },
}