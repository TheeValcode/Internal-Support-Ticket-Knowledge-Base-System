import { Request, Response, NextFunction } from 'express';
import { UserService, UserCreate, UserUpdate } from '../services/userService';
import { formatResponse } from '../utils/helpers';
import { AuthenticatedRequest } from '../middleware/auth';

export class UserController {
  static async getAllUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json(formatResponse(false, null, 'Admin access required'));
      }

      const users = UserService.getAllUsers();
      res.json(formatResponse(true, users, 'Users retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json(formatResponse(false, null, 'Admin access required'));
      }

      const userId = parseInt(req.params.id as string);
      const user = UserService.getUserById(userId);

      if (!user) {
        return res.status(404).json(formatResponse(false, null, 'User not found'));
      }

      // Get user's ticket statistics
      const ticketStats = UserService.getUserTicketStats(userId);

      res.json(formatResponse(true, { ...user, ticketStats }, 'User retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json(formatResponse(false, null, 'Admin access required'));
      }

      const { name, email, password, role = 'user' } = req.body;

      const userData: UserCreate = {
        name,
        email,
        password,
        role
      };

      const user = await UserService.createUser(userData);
      res.status(201).json(formatResponse(true, user, 'User created successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json(formatResponse(false, null, 'Admin access required'));
      }

      const userId = parseInt(req.params.id as string);
      const { name, email, role, is_active } = req.body;

      const updates: UserUpdate = {};
      if (name !== undefined) updates.name = name;
      if (email !== undefined) updates.email = email;
      if (role !== undefined) updates.role = role;
      if (is_active !== undefined) updates.is_active = is_active;

      const user = UserService.updateUser(userId, updates);
      res.json(formatResponse(true, user, 'User updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async resetUserPassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json(formatResponse(false, null, 'Admin access required'));
      }

      const userId = parseInt(req.params.id as string);
      const { password } = req.body;

      if (!password) {
        return res.status(400).json(formatResponse(false, null, 'Password is required'));
      }

      await UserService.resetUserPassword(userId, password);
      res.json(formatResponse(true, null, 'Password reset successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json(formatResponse(false, null, 'Admin access required'));
      }

      const userId = parseInt(req.params.id as string);
      
      // Prevent admin from deleting themselves
      if (userId === req.user.userId) {
        return res.status(400).json(formatResponse(false, null, 'Cannot delete your own account'));
      }

      const deleted = UserService.deleteUser(userId);
      
      if (!deleted) {
        return res.status(404).json(formatResponse(false, null, 'User not found'));
      }

      res.json(formatResponse(true, null, 'User deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async deactivateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json(formatResponse(false, null, 'Admin access required'));
      }

      const userId = parseInt(req.params.id as string);
      
      // Prevent admin from deactivating themselves
      if (userId === req.user.userId) {
        return res.status(400).json(formatResponse(false, null, 'Cannot deactivate your own account'));
      }

      const user = UserService.deactivateUser(userId);
      res.json(formatResponse(true, user, 'User deactivated successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async activateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json(formatResponse(false, null, 'Admin access required'));
      }

      const userId = parseInt(req.params.id as string);
      const user = UserService.activateUser(userId);
      res.json(formatResponse(true, user, 'User activated successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getUserStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json(formatResponse(false, null, 'Admin access required'));
      }

      const stats = UserService.getUserStats();
      res.json(formatResponse(true, stats, 'User statistics retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async searchUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json(formatResponse(false, null, 'Admin access required'));
      }

      const { q: query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json(formatResponse(false, null, 'Search query is required'));
      }

      const users = UserService.searchUsers(query);
      res.json(formatResponse(true, users, 'Search completed successfully'));
    } catch (error) {
      next(error);
    }
  }
}