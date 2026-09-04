import { Request, Response, NextFunction } from 'express';
import { authService } from '../service/auth';

export const authController = {
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await authService.register(req.body);

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
            const result = await authService.login(req.body);

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