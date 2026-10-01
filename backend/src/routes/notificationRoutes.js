import { Router } from 'express';
import { notificationController } from '../controllers/notificationController.js';
import { authenticateOptional } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateOptional, notificationController.getNotifications);
router.put('/:id/read', authenticateOptional, notificationController.markRead);
router.put('/read-all', authenticateOptional, notificationController.markAllRead);

export default router;
