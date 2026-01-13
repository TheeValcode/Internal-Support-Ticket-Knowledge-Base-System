import { Router } from 'express';
import { TicketController } from '../controllers/ticketController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All ticket routes require authentication
router.use(authenticate);

// Ticket CRUD operations
router.post('/', TicketController.createTicket);
router.get('/', TicketController.getTickets);
router.get('/search', TicketController.searchTickets);
router.get('/:id', TicketController.getTicketById);
router.put('/:id', requireAdmin, TicketController.updateTicket);
router.delete('/:id', requireAdmin, TicketController.deleteTicket);

// Ticket messages (chat-like interface)
router.post('/:id/messages', TicketController.addMessage);
router.get('/:id/messages', TicketController.getTicketMessages);

export default router;