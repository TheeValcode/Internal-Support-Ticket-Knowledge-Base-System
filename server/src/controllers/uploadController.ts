import { Request, Response, NextFunction } from 'express';
import { FileService } from '../services/fileService';
import { TicketService } from '../services/ticketService';
import { formatResponse } from '../utils/helpers';
import { AuthenticatedRequest } from '../middleware/auth';

export class UploadController {
  static async uploadAttachment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json(formatResponse(false, null, 'Authentication required'));
      }

      if (!req.file) {
        return res.status(400).json(formatResponse(false, null, 'No file uploaded'));
      }

      const ticketId = parseInt(req.params.ticketId as string);
      
      // Verify ticket exists and user has access
      const ticket = TicketService.getTicketById(ticketId);
      if (!ticket) {
        return res.status(404).json(formatResponse(false, null, 'Ticket not found'));
      }

      // Users can only upload to their own tickets, admins can upload to any ticket
      if (req.user.role !== 'admin' && ticket.user_id !== req.user.userId) {
        return res.status(403).json(formatResponse(false, null, 'Access denied'));
      }

      const attachment = await FileService.uploadFile(ticketId, req.user.userId, req.file);

      res.status(201).json(formatResponse(true, attachment, 'File uploaded successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getTicketAttachments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json(formatResponse(false, null, 'Authentication required'));
      }

      const ticketId = parseInt(req.params.ticketId as string);
      
      // Verify ticket exists and user has access
      const ticket = TicketService.getTicketById(ticketId);
      if (!ticket) {
        return res.status(404).json(formatResponse(false, null, 'Ticket not found'));
      }

      if (req.user.role !== 'admin' && ticket.user_id !== req.user.userId) {
        return res.status(403).json(formatResponse(false, null, 'Access denied'));
      }

      const attachments = FileService.getTicketAttachments(ticketId);

      res.json(formatResponse(true, attachments, 'Attachments retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async downloadAttachment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json(formatResponse(false, null, 'Authentication required'));
      }

      const attachmentId = parseInt(req.params.id as string);
      
      // Validate user access to this attachment
      if (!FileService.validateFileAccess(attachmentId, req.user.userId, req.user.role)) {
        return res.status(403).json(formatResponse(false, null, 'Access denied'));
      }

      const attachment = FileService.getAttachmentById(attachmentId);
      if (!attachment) {
        return res.status(404).json(formatResponse(false, null, 'Attachment not found'));
      }

      const fileStream = FileService.getFileStream(attachment);
      if (!fileStream) {
        return res.status(404).json(formatResponse(false, null, 'File not found on disk'));
      }

      // Set appropriate headers
      res.setHeader('Content-Type', attachment.mime_type);
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.original_filename}"`);
      res.setHeader('Content-Length', attachment.file_size);

      // Stream the file
      fileStream.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  static async deleteAttachment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json(formatResponse(false, null, 'Authentication required'));
      }

      const attachmentId = parseInt(req.params.id as string);
      
      // Only admins can delete attachments
      if (req.user.role !== 'admin') {
        return res.status(403).json(formatResponse(false, null, 'Admin access required'));
      }

      const deleted = FileService.deleteAttachment(attachmentId);

      if (!deleted) {
        return res.status(404).json(formatResponse(false, null, 'Attachment not found'));
      }

      res.json(formatResponse(true, null, 'Attachment deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}