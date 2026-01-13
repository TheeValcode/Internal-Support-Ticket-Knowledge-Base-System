import { Router } from 'express';
import { ArticleController } from '../controllers/articleController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', ArticleController.getArticles);
router.get('/search', ArticleController.searchArticles);
router.get('/categories', ArticleController.getCategories);
router.get('/:id', ArticleController.getArticleById);

// Admin-only routes
router.post('/', authenticate, requireAdmin, ArticleController.createArticle);
router.put('/:id', authenticate, requireAdmin, ArticleController.updateArticle);
router.delete('/:id', authenticate, requireAdmin, ArticleController.deleteArticle);

export default router;