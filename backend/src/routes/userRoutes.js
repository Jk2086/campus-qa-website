import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { userController } from '../controllers/userController.js';
import { reportController } from '../controllers/reportController.js';
import { authenticate, authenticateOptional } from '../middleware/auth.js';

const router = Router();

router.get('/', userController.getUsers);
router.get('/me', authenticate, authController.getMe);
router.put('/me', authenticate, authController.updateMe);
router.get('/:id', userController.getUser);
router.patch('/:id/availability', authenticateOptional, userController.updateAvailability);
router.post('/:id/report', authenticate, reportController.reportUser);

export default router;
