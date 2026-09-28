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
// 2. DTO dùng cho Auth (Đăng ký / Đăng nhập)
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
// User an toàn gửi về Frontend (ẩn password)
export type SafeUser = Omit<User, 'password'>;