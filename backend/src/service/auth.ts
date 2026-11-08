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
import { sessionService } from './session';
import { sessionRepository } from '../repository/Session';

const jwtSecretEnv = process.env['JWT_SECRET'];
if (!jwtSecretEnv) {
    throw new Error('JWT_SECRET is not defined in the environment variables');
}
const JWT_SECRET: string = jwtSecretEnv;

const JWT_EXPIRES_IN = process.env['JWT_EXPIRES_IN'];
if (!JWT_EXPIRES_IN) {
    throw new Error('JWT_EXPIRES_IN is not defined in the environment variables');
}

function generateToken(userId: string, role: string, sessionId: string): string {
    return jwt.sign({ userId, role, sid: sessionId }, JWT_SECRET, {
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

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

async function issueRefreshToken(data: { userId: string, sessionId: string, userAgent: string | null }, db: Db = pool): Promise<string> {
    const refreshToken = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await refreshTokenRepository.create({
        userId: data.userId,
        sessionId: data.sessionId,
        tokenHash: hashToken(refreshToken),
        userAgent: data.userAgent,
        expiresAt,
    }, db);

    return refreshToken;
}

async function startSession(userId: string, userAgent: string | null, db: Db): Promise<{ sessionId: string, refreshToken: string }> {
    const session = await sessionRepository.create({ userId, userAgent }, db);
    const refreshToken = await issueRefreshToken({ userId, sessionId: session.id, userAgent }, db);
    return { sessionId: session.id, refreshToken };
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

function decodeAccessToken(token: string): { sid: string } | null {
    try {
        const d = jwt.verify(token, JWT_SECRET) as { sid?: string };
        return d.sid ? { sid: d.sid } : null;
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
                const { sessionId, refreshToken } = await startSession(newUser.id, userAgent, client);

                return {
                    user: sanitizeUser(newUser),
                    accessToken: generateToken(newUser.id, newUser.role, sessionId),
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

        return withTransaction(async (client) => {
            const { sessionId, refreshToken } = await startSession(user.id, userAgent, client);
            return {
                user: sanitizeUser(user),
                accessToken: generateToken(user.id, user.role, sessionId),
                refreshToken,
            };
        });
    },

    async refresh(refreshToken: string, userAgent: string | null): Promise<{ accessToken: string; refreshToken: string }> {
        const stored = await refreshTokenRepository.findByHash(hashToken(refreshToken));
        if (!stored) {
            throw AppError.unauthorized('Invalid refresh token');
        }

        if (stored.revoked_at) {
            await sessionService.revoke(stored.session_id);
            throw AppError.unauthorized('Refresh token reuse detected');
        }

        if (stored.expires_at < new Date()) {
            throw AppError.unauthorized('Refresh token expired');
        }

        const session = await sessionRepository.findActiveById(stored.session_id);
        if (!session) {
            throw AppError.unauthorized('Session has been revoked');
        }

        const user = await userRepository.findById(stored.user_id);
        if (!user) {
            throw AppError.unauthorized('Invalid refresh token');
        }

        return withTransaction(async (client) => {
            await refreshTokenRepository.revoke(stored.id, client);
            const newRefreshToken = await issueRefreshToken({ userId: user.id, sessionId: stored.session_id, userAgent }, client);
            return {
                accessToken: generateToken(user.id, user.role, stored.session_id),
                refreshToken: newRefreshToken
            };
        });
    },

    async logout(refreshToken: string | null, accessToken: string | null): Promise<void> {
        const stored = refreshToken ? await refreshTokenRepository.findByHash(hashToken(refreshToken)) : null;
        const decoded = accessToken ? decodeAccessToken(accessToken) : null;

        const sessionId = stored?.session_id ?? decoded?.sid;
        if (sessionId) {
            await sessionService.revoke(sessionId);
        }
    },

    async getMe(userId: string): Promise<SafeUser> {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw AppError.unauthorized('User no longer exists');
        }
        return sanitizeUser(user);
    },

    signGoogleLinkToken(userId: string, state: string): string {
        return jwt.sign({ purpose: 'google-link', userId, state }, JWT_SECRET, { expiresIn: '10m' });
    },

    verifyGoogleLinkToken(token: string, state: string): string | null {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { purpose?: string; userId?: string; state?: string };
            return decoded.purpose === 'google-link' && decoded.state === state && decoded.userId
                ? decoded.userId
                : null;
        } catch {
            return null;
        }
    },

    async linkGoogle(userId: string, profile: GoogleProfile): Promise<void> {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw AppError.unauthorized('User no longer exists');
        }

        const owner = await oauthAccountRepository.findByProviderUser('google', profile.sub);
        if (owner) {
            if (owner.user_id === userId) return;
            throw AppError.conflict('This Google account is already linked to another user');
        }

        if (await oauthAccountRepository.findByUserAndProvider(userId, 'google')) {
            throw AppError.conflict('Your account is already linked to a different Google account');
        }

        await oauthAccountRepository.create({ userId, provider: 'google', providerUserId: profile.sub });
    },

    async loginWithGoogle(profile: GoogleProfile, userAgent: string | null): Promise<{ refreshToken: string }> {
        if (!profile.emailVerified) {
            throw AppError.badRequest('Google email is not verified');
        }

        const linked = await oauthAccountRepository.findByProviderUser('google', profile.sub);
        if (linked) {
            return withTransaction(async (client) => {
                const { refreshToken } = await startSession(linked.user_id, userAgent, client);
                return { refreshToken };
            });
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
            const { refreshToken } = await startSession(user.id, userAgent, client);
            return { refreshToken };

        });
    },

};