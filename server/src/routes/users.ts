import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All user management routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// User CRUD operations
router.get('/', UserController.getAllUsers);
router.get('/stats', UserController.getUserStats);
router.get('/search', UserController.searchUsers);
router.get('/:id', UserController.getUserById);
router.post('/', UserController.createUser);
router.put('/:id', UserController.updateUser);
router.delete('/:id', UserController.deleteUser);

// User management actions
router.post('/:id/reset-password', UserController.resetUserPassword);
router.post('/:id/deactivate', UserController.deactivateUser);
router.post('/:id/activate', UserController.activateUser);

export default router;