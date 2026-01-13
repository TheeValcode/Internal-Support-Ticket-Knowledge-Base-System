import fs from 'fs';
import path from 'path';
import { db } from '../database/connection';
import { generateUniqueFilename } from '../utils/helpers';

export interface Attachment {
  id: number;
  ticket_id: number;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: number;
  uploaded_at: string;
}

export class FileService {
  private static readonly UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
  private static readonly MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB

  static async uploadFile(
    ticketId: number,
    userId: number,
    file: Express.Multer.File
  ): Promise<Attachment> {
    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum limit of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Validate file type (basic security check)
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('File type not allowed');
    }

    // Generate unique filename
    const storedFilename = generateUniqueFilename(file.originalname);
    const filePath = path.join(this.UPLOAD_DIR, storedFilename);

    // Ensure upload directory exists
    if (!fs.existsSync(this.UPLOAD_DIR)) {
      fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
    }

    // Save file to disk
    fs.writeFileSync(filePath, file.buffer);

    // Save file info to database
    const insertAttachment = db.prepare(`
      INSERT INTO attachments (ticket_id, original_filename, stored_filename, file_path, file_size, mime_type, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertAttachment.run(
      ticketId,
      file.originalname,
      storedFilename,
      filePath,
      file.size,
      file.mimetype,
      userId
    );

    const attachmentId = result.lastInsertRowid as number;
    return this.getAttachmentById(attachmentId)!;
  }

  static getAttachmentById(id: number): Attachment | null {
    const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(id) as Attachment;
    return attachment || null;
  }

  static getTicketAttachments(ticketId: number): Attachment[] {
    const attachments = db.prepare('SELECT * FROM attachments WHERE ticket_id = ? ORDER BY uploaded_at DESC').all(ticketId) as Attachment[];
    return attachments;
  }

  static deleteAttachment(id: number): boolean {
    const attachment = this.getAttachmentById(id);
    if (!attachment) {
      return false;
    }

    // Delete file from disk
    try {
      if (fs.existsSync(attachment.file_path)) {
        fs.unlinkSync(attachment.file_path);
      }
    } catch (error) {
      console.error('Error deleting file from disk:', error);
    }

    // Delete from database
    const result = db.prepare('DELETE FROM attachments WHERE id = ?').run(id);
    return result.changes > 0;
  }

  static getFileStream(attachment: Attachment): fs.ReadStream | null {
    if (!fs.existsSync(attachment.file_path)) {
      return null;
    }

    return fs.createReadStream(attachment.file_path);
  }

  static validateFileAccess(attachmentId: number, userId: number, userRole: string): boolean {
    const attachment = this.getAttachmentById(attachmentId);
    if (!attachment) {
      return false;
    }

    // Admins can access all files
    if (userRole === 'admin') {
      return true;
    }

    // Get ticket info to check if user owns the ticket
    const ticket = db.prepare('SELECT user_id FROM tickets WHERE id = ?').get(attachment.ticket_id) as { user_id: number } | undefined;
    
    return ticket ? ticket.user_id === userId : false;
  }
}