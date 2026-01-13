export interface KnowledgeArticle {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author_id: number;
  status: 'draft' | 'published' | 'archived';
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface ArticleCreate {
  title: string;
  content: string;
  category: string;
  tags?: string[];
  status?: KnowledgeArticle['status'];
}