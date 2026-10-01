import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { reportController } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/me', authenticate, authController.getMe);
router.put('/me', authenticate, authController.updateMe);
router.post('/:id/report', authenticate, reportController.reportUser);

export default router;
