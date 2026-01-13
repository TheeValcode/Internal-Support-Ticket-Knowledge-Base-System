import { api, ApiResponse } from './api';
import { KnowledgeArticle, ArticleCreate } from '../types/article';

export const articleService = {
  async getArticles(params?: {
    category?: string;
    popular?: boolean;
    recent?: boolean;
    limit?: number;
  }): Promise<KnowledgeArticle[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.category) searchParams.append('category', params.category);
    if (params?.popular) searchParams.append('popular', 'true');
    if (params?.recent) searchParams.append('recent', 'true');
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await api.get<ApiResponse<KnowledgeArticle[]>>(`/articles?${searchParams}`);
    return response.data.data;
  },

  async getArticle(id: number): Promise<KnowledgeArticle> {
    const response = await api.get<ApiResponse<KnowledgeArticle>>(`/articles/${id}`);
    return response.data.data;
  },

  async searchArticles(query: string): Promise<KnowledgeArticle[]> {
    const response = await api.get<ApiResponse<KnowledgeArticle[]>>(`/articles/search?q=${encodeURIComponent(query)}`);
    return response.data.data;
  },

  async getCategories(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>('/articles/categories');
    return response.data.data;
  },

  // Admin only methods
  async createArticle(articleData: ArticleCreate): Promise<KnowledgeArticle> {
    const response = await api.post<ApiResponse<KnowledgeArticle>>('/articles', articleData);
    return response.data.data;
  },

  async updateArticle(id: number, articleData: Partial<ArticleCreate>): Promise<KnowledgeArticle> {
    const response = await api.put<ApiResponse<KnowledgeArticle>>(`/articles/${id}`, articleData);
    return response.data.data;
  },

  async deleteArticle(id: number): Promise<void> {
    await api.delete(`/articles/${id}`);
  }
};