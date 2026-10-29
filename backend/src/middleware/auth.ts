import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../model/User';
import { AppError } from '../errors/AppError';
import { revokedTokenRepository } from '../repository/RevokedToken';

const jwtSecretEnv = process.env['JWT_SECRET'];
if (!jwtSecretEnv) {
    throw new Error('JWT_SECRET is not defined in the environment variables');
}
const JWT_SECRET: string = jwtSecretEnv;

const jwtExpiresInEnv = process.env['JWT_EXPIRES_IN'];
if (!jwtExpiresInEnv) {
    throw new Error('JWT_EXPIRES_IN is not defined in the environment variables');
}

export async function protect(req: Request, _res: Response, next: NextFunction) {
    const token = readBearerToken(req);
    if (!token) throw AppError.unauthorized('Unauthorized: Please login to get access');

    let decoded: { userId: string; role: UserRole; jti?: string; exp: number };
    try {
        decoded = jwt.verify(token, JWT_SECRET) as typeof decoded;
    } catch {
        throw AppError.unauthorized('Unauthorized: Invalid or expired token');
    }

    if (!decoded.jti || await revokedTokenRepository.exists(decoded.jti)) {
        throw AppError.unauthorized('Unauthorized: Token has been revoked');
    }

    req.user = { userId: decoded.userId, role: decoded.role, jti: decoded.jti, exp: decoded.exp };
    next();
}

export function readBearerToken(req: Request): string | null {
    const header = req.headers.authorization;
    return header?.startsWith('Bearer ') ? header.slice(7) : null;
}

export function restrictTo(...allowedRoles: UserRole[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            throw AppError.forbidden('Forbidden: You do not have permission to perform this action');
        }
        next();
    };
}