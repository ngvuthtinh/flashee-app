import { Schema, required, isString, isEmail, minLength, maxLength } from './validate';

export const registerSchema: Schema = {
    user_name: [required, isString, maxLength(100)],
    email_address: [required, isString, isEmail, maxLength(255)],
    phone_number: [required, isString, maxLength(20)],
    password: [required, isString, minLength(8), maxLength(72)],
};

export const loginSchema: Schema = {
    email_address: [required, isString, isEmail],
    password: [required, isString],
};

export const refreshSchema: Schema = {
    refreshToken: [required, isString],
};