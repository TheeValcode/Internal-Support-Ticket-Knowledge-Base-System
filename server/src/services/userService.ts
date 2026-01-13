import bcrypt from 'bcrypt';
import { db } from '../database/connection';
import { User, UserRegistration } from '../types/auth';
import { validateEmail, sanitizeUser } from '../utils/helpers';

export interface UserUpdate {
  name?: string;
  email?: string;
  role?: 'user' | 'admin';
  is_active?: boolean;
}

export interface UserCreate extends UserRegistration {
  role?: 'user' | 'admin';
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  recentUsers: number; // users created in last 30 days
}

export class UserService {
  private static readonly SALT_ROUNDS = 12;

  static getAllUsers(): User[] {
    const users = db.prepare(`
      SELECT id, name, email, role, is_active, created_at, updated_at 
      FROM users 
      ORDER BY created_at DESC
    `).all() as any[];
    
    return users.map(user => ({
      ...user,
      is_active: Boolean(user.is_active)
    })) as User[];
  }

  static getUserById(id: number): User | null {
    const user = db.prepare(`
      SELECT id, name, email, role, is_active, created_at, updated_at 
      FROM users 
      WHERE id = ?
    `).get(id) as any;
    
    if (!user) return null;
    
    return {
      ...user,
      is_active: Boolean(user.is_active)
    } as User;
  }

  static async createUser(userData: UserCreate): Promise<User> {
    const { name, email, password, role = 'user' } = userData;

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

    if (!['user', 'admin'].includes(role)) {
      throw new Error('Invalid role. Must be "user" or "admin"');
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
      INSERT INTO users (name, email, password_hash, role, is_active)
      VALUES (?, ?, ?, ?, 1)
    `);

    const result = insertUser.run(name, email, password_hash, role);
    const userId = result.lastInsertRowid as number;

    return this.getUserById(userId)!;
  }

  static updateUser(id: number, updates: UserUpdate): User {
    const user = this.getUserById(id);
    if (!user) {
      throw new Error('User not found');
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updates.name !== undefined) {
      if (!updates.name.trim()) {
        throw new Error('Name cannot be empty');
      }
      updateFields.push('name = ?');
      updateValues.push(updates.name.trim());
    }

    if (updates.email !== undefined) {
      if (!validateEmail(updates.email)) {
        throw new Error('Invalid email format');
      }
      
      // Check if email is already taken by another user
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(updates.email, id);
      if (existingUser) {
        throw new Error('Email is already taken by another user');
      }
      
      updateFields.push('email = ?');
      updateValues.push(updates.email);
    }

    if (updates.role !== undefined) {
      if (!['user', 'admin'].includes(updates.role)) {
        throw new Error('Invalid role. Must be "user" or "admin"');
      }
      updateFields.push('role = ?');
      updateValues.push(updates.role);
    }

    if (updates.is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(updates.is_active ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return user;
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    db.prepare(updateQuery).run(...updateValues);

    return this.getUserById(id)!;
  }

  static async resetUserPassword(id: number, newPassword: string): Promise<void> {
    const user = this.getUserById(id);
    if (!user) {
      throw new Error('User not found');
    }

    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const password_hash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    
    db.prepare(`
      UPDATE users 
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(password_hash, id);
  }

  static deleteUser(id: number): boolean {
    const user = this.getUserById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has tickets
    const ticketCount = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE user_id = ?').get(id) as any;
    if (ticketCount.count > 0) {
      throw new Error('Cannot delete user with existing tickets. Deactivate the user instead.');
    }

    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return result.changes > 0;
  }

  static deactivateUser(id: number): User {
    return this.updateUser(id, { is_active: false });
  }

  static activateUser(id: number): User {
    return this.updateUser(id, { is_active: true });
  }

  static getUserStats(): UserStats {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    const activeUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get() as any;
    const adminUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin') as any;
    const recentUsers = db.prepare(`
      SELECT COUNT(*) as count FROM users 
      WHERE created_at >= datetime('now', '-30 days')
    `).get() as any;

    return {
      totalUsers: totalUsers.count,
      activeUsers: activeUsers.count,
      adminUsers: adminUsers.count,
      recentUsers: recentUsers.count
    };
  }

  static searchUsers(query: string): User[] {
    const users = db.prepare(`
      SELECT id, name, email, role, is_active, created_at, updated_at 
      FROM users 
      WHERE name LIKE ? OR email LIKE ?
      ORDER BY created_at DESC
    `).all(`%${query}%`, `%${query}%`) as any[];
    
    return users.map(user => ({
      ...user,
      is_active: Boolean(user.is_active)
    })) as User[];
  }

  static getUserTicketStats(userId: number) {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tickets,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_tickets,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_tickets
      FROM tickets 
      WHERE user_id = ?
    `).get(userId) as any;

    return stats;
  }
}