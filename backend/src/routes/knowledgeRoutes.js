import { Router } from 'express';
import { knowledgeController } from '../controllers/knowledgeController.js';
import { authenticateOptional } from '../middleware/auth.js';

const router = Router();

router.get('/', knowledgeController.getKnowledge);
router.get('/search', knowledgeController.searchKnowledge);
router.post('/', authenticateOptional, knowledgeController.createKnowledge);

export default router;
