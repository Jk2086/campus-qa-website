import { Router } from 'express';
import { resourceController } from '../controllers/resourceController.js';
import { authenticateOptional } from '../middleware/auth.js';

const router = Router();

router.get('/', resourceController.getResources);
router.get('/:id', resourceController.getResource);
router.post('/', authenticateOptional, resourceController.createResource);

export default router;
