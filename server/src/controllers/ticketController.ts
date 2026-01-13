import { Request, Response, NextFunction } from 'express';
import { TicketService } from '../services/ticketService';
import { formatResponse } from '../utils/helpers';
import { AuthenticatedRequest } from '../middleware/auth';

export class TicketController {
  static async createTicket(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json(formatResponse(false, null, 'Authentication required'));
      }

      const { title, description, category, priority = 'medium' } = req.body;
      
      const ticket = TicketService.createTicket(req.user.userId, {
        title,
        description,
        category,
        priority
      });

      res.status(201).json(formatResponse(true, ticket, 'Ticket created successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getTickets(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json(formatResponse(false, null, 'Authentication required'));
      }

      let tickets;
      
      if (req.user.role === 'admin') {
        tickets = TicketService.getAllTickets();
      } else {
        tickets = TicketService.getTicketsByUser(req.user.userId);
      }

      res.json(formatResponse(true, tickets, 'Tickets retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getTicketById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json(formatResponse(false, null, 'Authentication required'));
      }

      const ticketId = parseInt(req.params.id as string);
      const ticket = TicketService.getTicketWithDetails(ticketId);

      if (!ticket) {
        return res.status(404).json(formatResponse(false, null, 'Ticket not found'));
      }

      // Users can only view their own tickets, admins can view all
      if (req.user.role !== 'admin' && ticket.user_id !== req.user.userId) {
        return res.status(403).json(formatResponse(false, null, 'Access denied'));
      }

      res.json(formatResponse(true, ticket, 'Ticket retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async updateTicket(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json(formatResponse(false, null, 'Authentication required'));
      }

      const ticketId = parseInt(req.params.id as string);
      const { status, assigned_to, priority } = req.body;

      const ticket = TicketService.updateTicket(ticketId, {
        status,
        assigned_to,
        priority
      });

      res.json(formatResponse(true, ticket, 'Ticket updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async deleteTicket(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json(formatResponse(false, null, 'Authentication required'));
      }

      const ticketId = parseInt(req.params.id as string);
      const deleted = TicketService.deleteTicket(ticketId);

      if (!deleted) {
        return res.status(404).json(formatResponse(false, null, 'Ticket not found'));
      }

      res.json(formatResponse(true, null, 'Ticket deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async addMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json(formatResponse(false, null, 'Authentication required'));
      }

      const ticketId = parseInt(req.params.id as string);
      const { message, is_internal = false } = req.body;

      // Validate message content
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json(formatResponse(false, null, 'Message content is required'));
      }

      // Verify user can access this ticket
      const ticket = TicketService.getTicketById(ticketId);
      if (!ticket) {
        return res.status(404).json(formatResponse(false, null, 'Ticket not found'));
      }

      // Users can only add messages to their own tickets, admins can add to any
      if (req.user.role !== 'admin' && ticket.user_id !== req.user.userId) {
        return res.status(403).json(formatResponse(false, null, 'Access denied'));
      }

      // Only make messages internal if explicitly requested by admin
      const isInternalBool = req.user.role === 'admin' && (is_internal === true || is_internal === 'true' || is_internal === 1);

      const ticketMessage = TicketService.addMessage(ticketId, req.user.userId, {
        message: message.trim(),
        is_internal: isInternalBool
      });

      res.status(201).json(formatResponse(true, ticketMessage, 'Message added successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getTicketMessages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json(formatResponse(false, null, 'Authentication required'));
      }

      const ticketId = parseInt(req.params.id as string);
      
      // Verify user can access this ticket
      const ticket = TicketService.getTicketById(ticketId);
      if (!ticket) {
        return res.status(404).json(formatResponse(false, null, 'Ticket not found'));
      }

      if (req.user.role !== 'admin' && ticket.user_id !== req.user.userId) {
        return res.status(403).json(formatResponse(false, null, 'Access denied'));
      }

      const messages = TicketService.getTicketMessages(ticketId);
      
      // Filter internal messages for non-admin users
      const filteredMessages = req.user.role === 'admin' 
        ? messages 
        : messages.filter(message => !message.is_internal);

      res.json(formatResponse(true, filteredMessages, 'Messages retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async searchTickets(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json(formatResponse(false, null, 'Authentication required'));
      }

      const { q: query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json(formatResponse(false, null, 'Search query is required'));
      }

      const userId = req.user.role === 'admin' ? undefined : req.user.userId;
      const tickets = TicketService.searchTickets(query, userId);

      res.json(formatResponse(true, tickets, 'Search completed successfully'));
    } catch (error) {
      next(error);
    }
  }
}