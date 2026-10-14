import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repository/User';
import { RegisterDTO, LoginDTO, SafeUser } from '../model/User';
import crypto from 'crypto';
import { refreshTokenRepository } from '../repository/RefreshToken';

const jwtSecretEnv = process.env['JWT_SECRET'];
if (!jwtSecretEnv) {
    throw new Error('JWT_SECRET is not defined in the environment variables');
}
const JWT_SECRET: string = jwtSecretEnv;

const JWT_EXPIRES_IN = process.env['JWT_EXPIRES_IN'];
if (!JWT_EXPIRES_IN) {
    throw new Error('JWT_EXPIRES_IN is not defined in the environment variables');
}

function generateToken(userId: string, role: string): string {
    return jwt.sign({ userId, role }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN as any,
    });
}

function sanitizeUser(user: any): SafeUser {
    const { password, ...safeUser } = user;
    return safeUser;
}

const REFRESH_TOKEN_TTL_DAYS = 30;
// Computed once at startup; used to keep login timing equal when the email doesn't exist
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 12);


function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

async function issueRefreshToken(userId: string, userAgent: string | null): Promise<string> {
    const refreshToken = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await refreshTokenRepository.create({
        userId,
        tokenHash: hashToken(refreshToken),
        userAgent,
        expiresAt,
    });

    return refreshToken;
}

export const authService = {
    async register(data: RegisterDTO, userAgent: string | null): Promise<{ user: SafeUser; accessToken: string, refreshToken: string }> {
        const existingUser = await userRepository.findByEmail(data.email_address);
        if (existingUser) {
            const error: any = new Error('Email has already been used');
            error.statusCode = 400;
            throw error;
        }

        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(data.password, salt);

        const newUser = await userRepository.create({ ...data, passwordHash, });

        const accessToken = generateToken(newUser.id, newUser.role);
        const refreshToken = await issueRefreshToken(newUser.id, userAgent);

        return {
            user: sanitizeUser(newUser),
            accessToken,
            refreshToken,
        };
    },

    async login(data: LoginDTO, userAgent: string | null): Promise<{ user: SafeUser; accessToken: string, refreshToken: string }> {
        const user = await userRepository.findByEmail(data.email_address);
        const hashToCompare = user ? user.password : DUMMY_HASH;
        const isPasswordMatch = await bcrypt.compare(data.password, hashToCompare);

        if (!user || !isPasswordMatch) {
            const error: any = new Error('Email or Password is wrong');
            error.statusCode = 401;
            throw error;
        }

        const accessToken = generateToken(user.id, user.role);
        const refreshToken = await issueRefreshToken(user.id, userAgent);

        return {
            user: sanitizeUser(user),
            accessToken,
            refreshToken,
        };
    },
};