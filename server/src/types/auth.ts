export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRegistration {
  name: string;
  email: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: 'user' | 'admin';
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  token: string;
}