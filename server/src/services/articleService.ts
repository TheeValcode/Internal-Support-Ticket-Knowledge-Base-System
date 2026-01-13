import { db } from '../database/connection';
import { KnowledgeArticle, ArticleCreate, ArticleUpdate } from '../types/article';

export class ArticleService {
  static createArticle(authorId: number, articleData: ArticleCreate): KnowledgeArticle {
    const { title, content, category, tags = [], status = 'draft' } = articleData;
    
    if (!title || !content || !category) {
      throw new Error('Title, content, and category are required');
    }

    const tagsJson = JSON.stringify(tags);
    
    const insertArticle = db.prepare(`
      INSERT INTO knowledge_articles (title, content, category, tags, author_id, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insertArticle.run(title, content, category, tagsJson, authorId, status);
    const articleId = result.lastInsertRowid as number;

    return this.getArticleById(articleId)!;
  }

  static getArticleById(id: number): KnowledgeArticle | null {
    const article = db.prepare('SELECT * FROM knowledge_articles WHERE id = ?').get(id) as KnowledgeArticle;
    return article || null;
  }

  static getAllArticles(includeUnpublished = false): KnowledgeArticle[] {
    let query = 'SELECT * FROM knowledge_articles';
    
    if (!includeUnpublished) {
      query += " WHERE status = 'published'";
    }
    
    query += ' ORDER BY created_at DESC';
    
    const articles = db.prepare(query).all() as KnowledgeArticle[];
    return articles.map(this.parseArticleTags);
  }

  static getArticlesByCategory(category: string, includeUnpublished = false): KnowledgeArticle[] {
    let query = 'SELECT * FROM knowledge_articles WHERE category = ?';
    const params = [category];
    
    if (!includeUnpublished) {
      query += " AND status = 'published'";
    }
    
    query += ' ORDER BY created_at DESC';
    
    const articles = db.prepare(query).all(...params) as KnowledgeArticle[];
    return articles.map(this.parseArticleTags);
  }

  static updateArticle(id: number, updates: ArticleUpdate): KnowledgeArticle {
    const article = this.getArticleById(id);
    if (!article) {
      throw new Error('Article not found');
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updates.title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(updates.title);
    }

    if (updates.content !== undefined) {
      updateFields.push('content = ?');
      updateValues.push(updates.content);
    }

    if (updates.category !== undefined) {
      updateFields.push('category = ?');
      updateValues.push(updates.category);
    }

    if (updates.tags !== undefined) {
      updateFields.push('tags = ?');
      updateValues.push(JSON.stringify(updates.tags));
    }

    if (updates.status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(updates.status);
    }

    if (updateFields.length === 0) {
      return this.parseArticleTags(article);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    const updateQuery = `UPDATE knowledge_articles SET ${updateFields.join(', ')} WHERE id = ?`;
    db.prepare(updateQuery).run(...updateValues);

    return this.parseArticleTags(this.getArticleById(id)!);
  }

  static deleteArticle(id: number): boolean {
    const result = db.prepare('DELETE FROM knowledge_articles WHERE id = ?').run(id);
    return result.changes > 0;
  }

  static searchArticles(query: string, includeUnpublished = false): KnowledgeArticle[] {
    let searchQuery = `
      SELECT * FROM knowledge_articles 
      WHERE (title LIKE ? OR content LIKE ? OR category LIKE ?)
    `;
    const searchParams = [`%${query}%`, `%${query}%`, `%${query}%`];

    if (!includeUnpublished) {
      searchQuery += " AND status = 'published'";
    }

    searchQuery += ' ORDER BY created_at DESC';

    const articles = db.prepare(searchQuery).all(...searchParams) as KnowledgeArticle[];
    return articles.map(this.parseArticleTags);
  }

  static getCategories(): string[] {
    const categories = db.prepare('SELECT DISTINCT category FROM knowledge_articles WHERE status = "published" ORDER BY category').all() as { category: string }[];
    return categories.map(c => c.category);
  }

  static incrementViewCount(id: number): void {
    db.prepare('UPDATE knowledge_articles SET view_count = view_count + 1 WHERE id = ?').run(id);
  }

  static getPopularArticles(limit = 10): KnowledgeArticle[] {
    const articles = db.prepare(`
      SELECT * FROM knowledge_articles 
      WHERE status = 'published' 
      ORDER BY view_count DESC, created_at DESC 
      LIMIT ?
    `).all(limit) as KnowledgeArticle[];
    
    return articles.map(this.parseArticleTags);
  }

  static getRecentArticles(limit = 10): KnowledgeArticle[] {
    const articles = db.prepare(`
      SELECT * FROM knowledge_articles 
      WHERE status = 'published' 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(limit) as KnowledgeArticle[];
    
    return articles.map(this.parseArticleTags);
  }

  private static parseArticleTags(article: KnowledgeArticle): KnowledgeArticle {
    try {
      return {
        ...article,
        tags: article.tags ? JSON.parse(article.tags) : []
      };
    } catch {
      return {
        ...article,
        tags: '[]'
      };
    }
  }
}