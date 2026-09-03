export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface User {
    user_id: string;
    user_name: string;
    email_address: string;
    phone_number: string;
    password: string;
    role: UserRole;
    created_at: Date;
}

export interface Country {
    country_id: string;
    country_name?: string;
}
export interface Address {
    address_id: string;
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
    user_address_id: string;
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