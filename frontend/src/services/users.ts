import { api, ApiResponse } from './api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  ticketStats?: {
    total_tickets: number;
    open_tickets: number;
    in_progress_tickets: number;
    resolved_tickets: number;
    closed_tickets: number;
  };
}

export interface UserCreate {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
}

export interface UserUpdate {
  name?: string;
  email?: string;
  role?: 'user' | 'admin';
  is_active?: boolean;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  recentUsers: number;
}

export const userService = {
  async getAllUsers(): Promise<User[]> {
    const response = await api.get<ApiResponse<User[]>>('/users');
    return response.data.data;
  },

  async getUserById(id: number): Promise<User> {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },

  async createUser(userData: UserCreate): Promise<User> {
    const response = await api.post<ApiResponse<User>>('/users', userData);
    return response.data.data;
  },

  async updateUser(id: number, updates: UserUpdate): Promise<User> {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, updates);
    return response.data.data;
  },

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async resetUserPassword(id: number, password: string): Promise<void> {
    await api.post(`/users/${id}/reset-password`, { password });
  },

  async deactivateUser(id: number): Promise<User> {
    const response = await api.post<ApiResponse<User>>(`/users/${id}/deactivate`);
    return response.data.data;
  },

  async activateUser(id: number): Promise<User> {
    const response = await api.post<ApiResponse<User>>(`/users/${id}/activate`);
    return response.data.data;
  },

  async getUserStats(): Promise<UserStats> {
    const response = await api.get<ApiResponse<UserStats>>('/users/stats');
    return response.data.data;
  },

  async searchUsers(query: string): Promise<User[]> {
    const response = await api.get<ApiResponse<User[]>>(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data.data;
  }
};