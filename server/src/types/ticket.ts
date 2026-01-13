export interface Ticket {
  id: number;
  ticket_number: string;
  user_id: number;
  title: string;
  description: string;
  category: 'hardware' | 'software' | 'network' | 'access' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: number;
  created_at: string;
  updated_at: string;
}

export interface TicketCreate {
  title: string;
  description: string;
  category: Ticket['category'];
  priority: Ticket['priority'];
}

export interface TicketUpdate {
  status?: Ticket['status'];
  assigned_to?: number;
  priority?: Ticket['priority'];
}

export interface TicketMessage {
  id: number;
  ticket_id: number;
  user_id: number;
  message: string;
  is_internal: boolean;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export interface TicketMessageCreate {
  message: string;
  is_internal?: boolean;
}