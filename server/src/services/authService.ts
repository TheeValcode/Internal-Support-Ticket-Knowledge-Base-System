import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../database/connection';
import { User, UserRegistration, UserLogin, JWTPayload, AuthResponse } from '../types/auth';
import { validateEmail, sanitizeUser } from '../utils/helpers';

export class AuthService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

  static async register(userData: UserRegistration): Promise<AuthResponse> {
    const { name, email, password } = userData;

    // Validate input
    if (!name || !email || !password) {
      throw new Error('Name, email, and password are required');
    }

    if (!validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Insert user
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, 'user')
    `);

    const result = insertUser.run(name, email, password_hash);
    const userId = result.lastInsertRowid as number;

    // Get created user
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User;
    
    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return {
      user: sanitizeUser(user),
      token
    };
  }

  static async login(credentials: UserLogin): Promise<AuthResponse> {
    const { email, password } = credentials;

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Find user
    const userData = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email) as any;
    if (!userData) {
      throw new Error('Invalid credentials');
    }

    // Convert integer back to boolean
    const user: User = {
      ...userData,
      is_active: Boolean(userData.is_active)
    };

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return {
      user: sanitizeUser(user),
      token
    };
  }

  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, { 
      expiresIn: this.JWT_EXPIRES_IN 
    } as jwt.SignOptions);
  }

  static verifyToken(token: string): JWTPayload {
    return jwt.verify(token, this.JWT_SECRET) as JWTPayload;
  }

  static getUserById(id: number): User | null {
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1').get(id) as any;
    if (!user) return null;
    
    // Convert integer back to boolean
    return {
      ...user,
      is_active: Boolean(user.is_active)
    } as User;
  }
}