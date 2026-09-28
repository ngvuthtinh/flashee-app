import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repository/User';
import { RegisterDTO, LoginDTO, SafeUser } from '../model/User';

const JWT_SECRET = process.env['JWT_SECRET'] || 'default_secret';
const JWT_EXPIRES_IN = process.env['JWT_EXPIRES_IN'] || '7d';

function generateToken(userId: string, role: string): string {
    return jwt.sign({userId, role}, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN as any,
    });
}

function sanitizeUser(user: any): SafeUser {
    const { password, ...safeUser} = user;
    return safeUser;
}

export const authService = {
    async register(data: RegisterDTO): Promise<{ user: SafeUser; token: string}> {
        const existingUser = await userRepository.findByEmail(data.email_address);
        if (existingUser) {
            const error: any = new Error('Email has already been used');
            error.statusCode = 400;
            throw error;
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(data.password, salt);

        const newUser = await userRepository.create({...data, passwordHash,});

        const token = generateToken(newUser.id, newUser.role);
        return {
            user: sanitizeUser(newUser),
            token,
        };
    },

    async login(data: LoginDTO): Promise<{ user: SafeUser; token: string }> {
        const user = await userRepository.findByEmail(data.email_address);
        if (!user){
            const error: any = new Error('Email or Password is wrong');
            error.statusCode = 401;
            throw error;
        }

        const isPasswordMatch  = await bcrypt.compare(data.password, user.password);
        if (!isPasswordMatch ) {
            const error: any = new Error('Email or Password is wrong');
            error.statusCode = 401;
            throw error;
        }

        const token = generateToken(user.id, user.role);
        return {
            user: sanitizeUser(user),
            token,
        };
    },
};