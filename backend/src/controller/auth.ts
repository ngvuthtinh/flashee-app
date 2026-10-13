import { Request, Response, NextFunction } from 'express';
import { authService } from '../service/auth';

export const authController = {
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const userAgent = req.headers['user-agent'] ?? null;
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
            const userAgent = req.headers['user-agent'] ?? null;
            const result = await authService.login(req.body, userAgent);

            res.status(201).json({
                success: true,
                message: 'Logged in successfully',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}