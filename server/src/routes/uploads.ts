import { Router } from 'express';
import { UploadController } from '../controllers/uploadController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// All upload routes require authentication
router.use(authenticate);

// Ticket attachment routes
router.post('/tickets/:ticketId/attachments', upload.single('file'), UploadController.uploadAttachment);
router.get('/tickets/:ticketId/attachments', UploadController.getTicketAttachments);

// Attachment management routes
router.get('/attachments/:id/download', UploadController.downloadAttachment);
router.delete('/attachments/:id', requireAdmin, UploadController.deleteAttachment);

export default router;