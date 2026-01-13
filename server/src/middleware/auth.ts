import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { formatResponse } from '../utils/helpers';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: 'user' | 'admin';
  };
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(formatResponse(false, null, 'Access token required'));
    }

    const token = authHeader.substring(7);
    const decoded = AuthService.verifyToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json(formatResponse(false, null, 'Invalid or expired token'));
  }
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json(formatResponse(false, null, 'Authentication required'));
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json(formatResponse(false, null, 'Admin access required'));
  }

  next();
};