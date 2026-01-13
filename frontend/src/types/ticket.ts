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
  user?: {
    id: number;
    name: string;
    email: string;
  };
  assigned_admin?: {
    id: number;
    name: string;
    email: string;
  };
  messages?: TicketMessage[];
}

export interface TicketCreate {
  title: string;
  description: string;
  category: Ticket['category'];
  priority: Ticket['priority'];
}

export interface CreateTicketData {
  title: string;
  description: string;
  category: Ticket['category'];
  priority: Ticket['priority'];
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