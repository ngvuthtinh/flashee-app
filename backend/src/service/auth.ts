import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repository/User';
import { RegisterDTO, LoginDTO, SafeUser } from '../model/User';
import crypto from 'crypto';
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

const REFRESH_ROTATE_AFTER_MS = 60 * 60 * 1000;

function generateRefreshToken(): { token: string; hash: string } {
    const token = crypto.randomBytes(48).toString('hex');
    return { token, hash: hashToken(token) };
}

function refreshExpiry(): Date {
    return new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
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

async function startSession(userId: string, userAgent: string | null, db: Db = pool): Promise<{ sessionId: string, refreshToken: string }> {
    const { token, hash } = generateRefreshToken();
    const session = await sessionRepository.create({ userId, userAgent, tokenHash: hash, expiresAt: refreshExpiry() }, db);
    return { sessionId: session.id, refreshToken: token };
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

    async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> {
        const hash = hashToken(refreshToken);
        const session = await sessionRepository.findByTokenHash(hash);

        if (!session) {
            const reused = await sessionRepository.findByPreviousTokenHash(hash);
            if (reused) {
                await sessionService.revoke(reused.id);
                throw AppError.unauthorized('Refresh token reuse detected');
            }
            throw AppError.unauthorized('Invalid refresh token');
        }

        if (session.revoked_at) {
            throw AppError.unauthorized('Session has been revoked');
        }
        if (session.expires_at < new Date()) {
            throw AppError.unauthorized('Refresh token expired');
        }

        const user = await userRepository.findById(session.user_id);
        if (!user) {
            throw AppError.unauthorized('Invalid refresh token');
        }

        const accessToken = generateToken(user.id, user.role, session.id);

        // F5 and normal refreshes inside the threshold only mint a new access token
        if (Date.now() - session.token_issued_at.getTime() < REFRESH_ROTATE_AFTER_MS) {
            return { accessToken };
        }

        const { token, hash: newHash } = generateRefreshToken();
        const rotated = await sessionRepository.rotate(session.id, hash, newHash, refreshExpiry());
        return rotated ? { accessToken, refreshToken: token } : { accessToken };
    },

    async logout(refreshToken: string | null, accessToken: string | null): Promise<void> {
        const session = refreshToken ? await sessionRepository.findByTokenHash(hashToken(refreshToken)) : null;
        const decoded = accessToken ? decodeAccessToken(accessToken) : null;

        const sessionId = session?.id ?? decoded?.sid;
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
            throw AppError.conflict('This Google account is already linked to another user').withCode('google_taken');
        }

        if (await oauthAccountRepository.findByUserAndProvider(userId, 'google')) {
            throw AppError.conflict('Your account is already linked to a different Google account').withCode('google_already_linked');
        }

        await oauthAccountRepository.create({ userId, provider: 'google', providerUserId: profile.sub });
    },

    async loginWithGoogle(profile: GoogleProfile, userAgent: string | null): Promise<{ refreshToken: string }> {
        if (!profile.emailVerified) {
            throw AppError.badRequest('Google email is not verified').withCode('email_not_verified');
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
            throw AppError.badRequest('Email has already been registered').withCode('email_taken');
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