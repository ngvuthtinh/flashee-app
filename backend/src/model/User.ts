export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface User {
    id: string;
    user_name: string;
    email_address: string;
    phone_number: string;
    password: string;
    role: UserRole;
    created_at: Date;
}

export interface Country {
    id: string;
    country_name?: string;
    country_code: string;
}
export interface Address {
    id: string;
    name?: string;
    street?: string;
    ward?: string;
    district?: string;
    city?: string;
    longitude?: number;
    latitude?: number;
    created_at?: Date;
    country_id: string;
}
export interface UserAddress {
    id: string;
    user_id: string;
    address_id: string;
    is_default: boolean;
}

// ==========================================
// 2. DTOs for Auth (Register / Login)
// ==========================================
export interface RegisterDTO {
  user_name: string;
  email_address: string;
  phone_number: string;
  password: string;
}
export interface LoginDTO {
  email_address: string;
  password: string;
}
// User that is safe to send to the Frontend (password hidden)
export type SafeUser = Omit<User, 'password'>;