import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../model/User';

const JWT_SECRET = process.env['JWT_SECRET'] || 'default_secret';

export function protect(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const error: any = new Error('Unauthorized: Please login to get access');
        error.statusCode = 401;
        return next(error);
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token!, JWT_SECRET) as {
            userId: string;
            role: UserRole;
        };

        req.user = decoded;
        next();
    } catch (err) {
        const error: any = new Error('Unauthorized: Invalid or expired token');
        error.statusCode = 401;
        next(error);
    };
}

export function restrictTo(...allowedRoles: UserRole[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            const error: any = new Error('Forbidden: You do not have permission to perform this action');
            error.statusCode = 403; // 403 Forbidden (Đã đăng nhập nhưng không đủ thẩm quyền)
            return next(error);
        }

        next();
    };
}