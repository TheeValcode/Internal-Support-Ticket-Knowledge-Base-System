import { db } from '../database/connection';
import { Ticket, TicketCreate, TicketUpdate, TicketMessage, TicketMessageCreate } from '../types/ticket';
import { generateTicketNumber } from '../utils/helpers';

export class TicketService {
  static createTicket(userId: number, ticketData: TicketCreate): Ticket {
    const { title, description, category, priority } = ticketData;
    
    if (!title || !description || !category) {
      throw new Error('Title, description, and category are required');
    }

    const ticketNumber = generateTicketNumber();
    
    const insertTicket = db.prepare(`
      INSERT INTO tickets (ticket_number, user_id, title, description, category, priority)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insertTicket.run(ticketNumber, userId, title, description, category, priority);
    const ticketId = result.lastInsertRowid as number;

    return this.getTicketById(ticketId)!;
  }

  static getTicketById(id: number): Ticket | null {
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id) as Ticket;
    return ticket || null;
  }

  static getTicketsByUser(userId: number): Ticket[] {
    const tickets = db.prepare('SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC').all(userId) as Ticket[];
    return tickets;
  }

  static getAllTickets(): Ticket[] {
    const tickets = db.prepare('SELECT * FROM tickets ORDER BY created_at DESC').all() as Ticket[];
    return tickets;
  }

  static updateTicket(id: number, updates: TicketUpdate): Ticket {
    const ticket = this.getTicketById(id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updates.status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(updates.status);
    }

    if (updates.assigned_to !== undefined) {
      updateFields.push('assigned_to = ?');
      updateValues.push(updates.assigned_to);
    }

    if (updates.priority !== undefined) {
      updateFields.push('priority = ?');
      updateValues.push(updates.priority);
    }

    if (updateFields.length === 0) {
      return ticket;
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    const updateQuery = `UPDATE tickets SET ${updateFields.join(', ')} WHERE id = ?`;
    db.prepare(updateQuery).run(...updateValues);

    return this.getTicketById(id)!;
  }

  static deleteTicket(id: number): boolean {
    const result = db.prepare('DELETE FROM tickets WHERE id = ?').run(id);
    return result.changes > 0;
  }

  static addMessage(ticketId: number, userId: number, messageData: TicketMessageCreate): TicketMessage {
    const { message, is_internal = false } = messageData;

    if (!message || message.trim().length === 0) {
      throw new Error('Message content is required');
    }

    // Verify ticket exists
    const ticket = this.getTicketById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const insertMessage = db.prepare(`
      INSERT INTO ticket_messages (ticket_id, user_id, message, is_internal)
      VALUES (?, ?, ?, ?)
    `);

    // Ensure proper type conversion for SQLite - convert any truthy/falsy value to 1/0
    const isInternalValue = is_internal ? 1 : 0;
    
    const result = insertMessage.run(ticketId, userId, message.trim(), isInternalValue);
    const messageId = result.lastInsertRowid as number;

    return this.getMessageById(messageId)!;
  }

  static getMessageById(id: number): TicketMessage | null {
    const message = db.prepare(`
      SELECT tm.*, u.name, u.email, u.role 
      FROM ticket_messages tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.id = ?
    `).get(id) as any;
    
    if (!message) return null;
    
    // Convert integer back to boolean and structure user data
    return {
      id: message.id,
      ticket_id: message.ticket_id,
      user_id: message.user_id,
      message: message.message,
      is_internal: Boolean(message.is_internal),
      created_at: message.created_at,
      user: {
        id: message.user_id,
        name: message.name,
        email: message.email,
        role: message.role
      }
    } as TicketMessage;
  }

  static getTicketMessages(ticketId: number): TicketMessage[] {
    const messages = db.prepare(`
      SELECT tm.*, u.name, u.email, u.role 
      FROM ticket_messages tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.ticket_id = ? 
      ORDER BY tm.created_at ASC
    `).all(ticketId) as any[];
    
    // Convert integers back to booleans and structure user data
    return messages.map(message => ({
      id: message.id,
      ticket_id: message.ticket_id,
      user_id: message.user_id,
      message: message.message,
      is_internal: Boolean(message.is_internal),
      created_at: message.created_at,
      user: {
        id: message.user_id,
        name: message.name,
        email: message.email,
        role: message.role
      }
    })) as TicketMessage[];
  }

  static getTicketWithDetails(id: number) {
    const ticket = this.getTicketById(id);
    if (!ticket) {
      return null;
    }

    const messages = this.getTicketMessages(id);
    
    // Get user info
    const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(ticket.user_id);
    
    // Get assigned admin info if exists
    let assignedAdmin = null;
    if (ticket.assigned_to) {
      assignedAdmin = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(ticket.assigned_to);
    }

    return {
      ...ticket,
      user,
      assigned_admin: assignedAdmin,
      messages
    };
  }

  static searchTickets(query: string, userId?: number): Ticket[] {
    let searchQuery = `
      SELECT * FROM tickets 
      WHERE (title LIKE ? OR description LIKE ? OR ticket_number LIKE ?)
    `;
    const searchParams = [`%${query}%`, `%${query}%`, `%${query}%`];

    if (userId) {
      searchQuery += ' AND user_id = ?';
      searchParams.push(userId.toString());
    }

    searchQuery += ' ORDER BY created_at DESC';

    const tickets = db.prepare(searchQuery).all(...searchParams) as Ticket[];
    return tickets;
  }
}