import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repository/User';
import { RegisterDTO, LoginDTO, SafeUser } from '../model/User';
import crypto from 'crypto';
import { refreshTokenRepository } from '../repository/RefreshToken';
import pool from '../config/db';
import { Db, withTransaction } from '../database/transaction';
import { AppError } from '../errors/AppError';
import { oauthAccountRepository } from '../repository/OAuthAccount';
import { GoogleProfile } from './googleOAuth';
import { revokedTokenRepository } from '../repository/RevokedToken';

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
        jwtid: crypto.randomUUID(),
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

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

async function issueRefreshToken(userId: string, userAgent: string | null, db: Db = pool): Promise<string> {
    const refreshToken = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await refreshTokenRepository.create({
        userId,
        tokenHash: hashToken(refreshToken),
        userAgent,
        expiresAt,
    }, db);

    return refreshToken;
}

function isUniqueViolation(error: unknown, constraint: string): boolean {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505' &&
        'constraint' in error &&
        error.constraint === constraint
    );
}

function decodeAccessToken(token: string): { jti: string; exp: number } | null {
    try {
        const d = jwt.verify(token, JWT_SECRET) as { jti?: string; exp?: number };
        return d.jti && d.exp ? { jti: d.jti, exp: d.exp } : null;
    } catch {
        return null;
    }
}

export const authService = {
    async register(data: RegisterDTO, userAgent: string | null): Promise<{ user: SafeUser; accessToken: string, refreshToken: string }> {
        const email = normalizeEmail(data.email_address);

        const existingUser = await userRepository.findByEmail(normalizeEmail(data.email_address));
        if (existingUser) {
            throw AppError.badRequest('Email has already been used');
        }

        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(data.password, salt);

        try {
            return await withTransaction(async (client) => {
                const newUser = await userRepository.create(
                    { ...data, email_address: email, passwordHash },
                    client,
                );
                const refreshToken = await issueRefreshToken(newUser.id, userAgent, client);

                return {
                    user: sanitizeUser(newUser),
                    accessToken: generateToken(newUser.id, newUser.role),
                    refreshToken,
                };
            });
        } catch (error) {
            if (isUniqueViolation(error, 'users_email_address_key')) {
                throw AppError.badRequest('Email has already been used');
            }
            throw error;
        }
    },

    async login(data: LoginDTO, userAgent: string | null): Promise<{ user: SafeUser; accessToken: string, refreshToken: string }> {
        const user = await userRepository.findByEmail(normalizeEmail(data.email_address));
        const hashToCompare = user?.password ?? DUMMY_HASH;
        const isPasswordMatch = await bcrypt.compare(data.password, hashToCompare);

        if (!user || !user.password || !isPasswordMatch) {
            throw AppError.unauthorized('Email or Password is wrong');
        }

        const accessToken = generateToken(user.id, user.role);
        const refreshToken = await issueRefreshToken(user.id, userAgent);

        return {
            user: sanitizeUser(user),
            accessToken,
            refreshToken,
        };
    },

    async refresh(refreshToken: string, userAgent: string | null): Promise<{ accessToken: string; refreshToken: string }> {
        const stored = await refreshTokenRepository.findByHash(hashToken(refreshToken));
        if (!stored) {
            throw AppError.unauthorized('Invalid refresh token');
        }

        if (stored.revoked_at) {
            await refreshTokenRepository.revokeAllByUserId(stored.user_id);
            throw AppError.unauthorized('Refresh token reuse detected');
        }

        if (stored.expires_at < new Date()) {
            throw AppError.unauthorized('Refresh token expired');
        }

        const user = await userRepository.findById(stored.user_id);
        if (!user) {
            throw AppError.unauthorized('Invalid refresh token');
        }

        return withTransaction(async (client) => {
            await refreshTokenRepository.revoke(stored.id, client);
            const newRefreshToken = await issueRefreshToken(user.id, userAgent, client);
            return {
                accessToken: generateToken(user.id, user.role),
                refreshToken: newRefreshToken
            };
        });
    },

    async logout(refreshToken: string | null, accessToken: string | null): Promise<void> {
        if (refreshToken) {
            const stored = await refreshTokenRepository.findByHash(hashToken(refreshToken));
            if (stored && !stored.revoked_at) {
                await refreshTokenRepository.revoke(stored.id);
            }
        }

        const decoded = accessToken ? decodeAccessToken(accessToken) : null;
        if (decoded) {
            await revokedTokenRepository.add(decoded.jti, new Date(decoded.exp * 1000));
        }
    },

    async getMe(userId: string): Promise<SafeUser> {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw AppError.unauthorized('User no longer exists');
        }
        return sanitizeUser(user);
    },

    async loginWithGoogle(profile: GoogleProfile, userAgent: string | null): Promise<{ refreshToken: string }> {
        if (!profile.emailVerified) {
            throw AppError.badRequest('Google email is not verified');
        }

        const linked = await oauthAccountRepository.findByProviderUser('google', profile.sub);
        if (linked) {
            return { refreshToken: await issueRefreshToken(linked.user_id, userAgent) };
        }

        const email = normalizeEmail(profile.email);
        if (await userRepository.findByEmail(email)) {
            throw AppError.badRequest('Email has already been registered');
        }

        return withTransaction(async (client) => {
            const user = await userRepository.createOAuthUser(
                { userName: profile.name ?? email.split('@')[0]!, email },
                client,
            );
            await oauthAccountRepository.create(
                { userId: user.id, provider: 'google', providerUserId: profile.sub },
                client,
            );
            return { refreshToken: await issueRefreshToken(user.id, userAgent, client) };
        });
    },

};