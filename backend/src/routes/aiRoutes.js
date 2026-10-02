import { Router } from 'express';
import { aiController } from '../controllers/aiController.js';

const router = Router();

router.post('/hint', aiController.getHint);
router.post('/explain', aiController.explainConcept);
router.post('/similar-questions', aiController.relatedQuestions);
router.post('/query', aiController.processQuery);
router.post('/chat', aiController.chat);
router.post('/classify', aiController.classify);

export default router;
