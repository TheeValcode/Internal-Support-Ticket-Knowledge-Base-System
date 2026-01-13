import { Request, Response, NextFunction } from 'express';
import { ArticleService } from '../services/articleService';
import { formatResponse } from '../utils/helpers';
import { AuthenticatedRequest } from '../middleware/auth';

export class ArticleController {
  static async createArticle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json(formatResponse(false, null, 'Authentication required'));
      }

      const { title, content, category, tags, status } = req.body;
      
      const article = ArticleService.createArticle(req.user.userId, {
        title,
        content,
        category,
        tags,
        status
      });

      res.status(201).json(formatResponse(true, article, 'Article created successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getArticles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { category, popular, recent } = req.query;
      const includeUnpublished = req.user?.role === 'admin';

      let articles;

      if (popular === 'true') {
        const limit = parseInt(req.query.limit as string) || 10;
        articles = ArticleService.getPopularArticles(limit);
      } else if (recent === 'true') {
        const limit = parseInt(req.query.limit as string) || 10;
        articles = ArticleService.getRecentArticles(limit);
      } else if (category && typeof category === 'string') {
        articles = ArticleService.getArticlesByCategory(category, includeUnpublished);
      } else {
        articles = ArticleService.getAllArticles(includeUnpublished);
      }

      res.json(formatResponse(true, articles, 'Articles retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getArticleById(req: Request, res: Response, next: NextFunction) {
    try {
      const articleId = parseInt(req.params.id as string);
      const article = ArticleService.getArticleById(articleId);

      if (!article) {
        return res.status(404).json(formatResponse(false, null, 'Article not found'));
      }

      // Increment view count for published articles
      if (article.status === 'published') {
        ArticleService.incrementViewCount(articleId);
      }

      res.json(formatResponse(true, article, 'Article retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async updateArticle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json(formatResponse(false, null, 'Authentication required'));
      }

      const articleId = parseInt(req.params.id as string);
      const { title, content, category, tags, status } = req.body;

      const article = ArticleService.updateArticle(articleId, {
        title,
        content,
        category,
        tags,
        status
      });

      res.json(formatResponse(true, article, 'Article updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async deleteArticle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json(formatResponse(false, null, 'Authentication required'));
      }

      const articleId = parseInt(req.params.id as string);
      const deleted = ArticleService.deleteArticle(articleId);

      if (!deleted) {
        return res.status(404).json(formatResponse(false, null, 'Article not found'));
      }

      res.json(formatResponse(true, null, 'Article deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async searchArticles(req: Request, res: Response, next: NextFunction) {
    try {
      const { q: query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json(formatResponse(false, null, 'Search query is required'));
      }

      const articles = ArticleService.searchArticles(query);

      res.json(formatResponse(true, articles, 'Search completed successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = ArticleService.getCategories();
      res.json(formatResponse(true, categories, 'Categories retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }
}