import { Router } from 'express';
import { reportController } from '../controllers/reportController.js';
import { authenticateOptional } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticateOptional, reportController.createReport);
router.get('/admin', authenticateOptional, reportController.getReports);
router.put('/admin/:id', authenticateOptional, reportController.updateReport);
router.get('/logs', authenticateOptional, reportController.getLogs);

export default router;
