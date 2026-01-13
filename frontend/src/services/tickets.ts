import { api, ApiResponse } from './api';
import { Ticket, TicketCreate, TicketMessage, Attachment } from '../types/ticket';

export const ticketService = {
  async getTickets(): Promise<Ticket[]> {
    const response = await api.get<ApiResponse<Ticket[]>>('/tickets');
    return response.data.data;
  },

  async getTicket(id: number): Promise<Ticket> {
    const response = await api.get<ApiResponse<Ticket>>(`/tickets/${id}`);
    return response.data.data;
  },

  async createTicket(ticketData: TicketCreate): Promise<Ticket> {
    const response = await api.post<ApiResponse<Ticket>>('/tickets', ticketData);
    return response.data.data;
  },

  async updateTicketStatus(id: number, status: Ticket['status']): Promise<Ticket> {
    const response = await api.put<ApiResponse<Ticket>>(`/tickets/${id}`, { status });
    return response.data.data;
  },

  async addTicketMessage(ticketId: number, message: string, isInternal: boolean = false): Promise<TicketMessage> {
    const response = await api.post<ApiResponse<TicketMessage>>(`/tickets/${ticketId}/messages`, {
      message,
      is_internal: isInternal
    });
    return response.data.data;
  },

  async getTicketMessages(ticketId: number): Promise<TicketMessage[]> {
    const response = await api.get<ApiResponse<TicketMessage[]>>(`/tickets/${ticketId}/messages`);
    return response.data.data;
  },

  async searchTickets(query: string): Promise<Ticket[]> {
    const response = await api.get<ApiResponse<Ticket[]>>(`/tickets/search?q=${encodeURIComponent(query)}`);
    return response.data.data;
  },

  async uploadAttachment(ticketId: number, file: File): Promise<Attachment> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ApiResponse<Attachment>>(
      `/tickets/${ticketId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  async getTicketAttachments(ticketId: number): Promise<Attachment[]> {
    const response = await api.get<ApiResponse<Attachment[]>>(`/tickets/${ticketId}/attachments`);
    return response.data.data;
  },

  async downloadAttachment(attachmentId: number): Promise<Blob> {
    const response = await api.get(`/attachments/${attachmentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async deleteAttachment(attachmentId: number): Promise<void> {
    await api.delete(`/attachments/${attachmentId}`);
  }
};