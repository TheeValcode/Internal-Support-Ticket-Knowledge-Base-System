import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { formatResponse, sanitizeUser } from '../utils/helpers';
import { AuthenticatedRequest } from '../middleware/auth';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password } = req.body;
      
      const result = await AuthService.register({ name, email, password });
      
      res.status(201).json(formatResponse(true, result, 'User registered successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      
      const result = await AuthService.login({ email, password });
      
      res.json(formatResponse(true, result, 'Login successful'));
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json(formatResponse(false, null, 'Authentication required'));
      }

      const user = AuthService.getUserById(req.user.userId);
      if (!user) {
        return res.status(404).json(formatResponse(false, null, 'User not found'));
      }

      res.json(formatResponse(true, sanitizeUser(user), 'Profile retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response) {
    // Since we're using stateless JWT, logout is handled client-side
    // In a production app, you might want to implement token blacklisting
    res.json(formatResponse(true, null, 'Logout successful'));
  }
}