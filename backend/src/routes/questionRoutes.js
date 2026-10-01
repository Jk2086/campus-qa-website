import { Router } from 'express';
import { questionController } from '../controllers/questionController.js';
import { answerController } from '../controllers/answerController.js';
import { authenticateOptional, authenticate } from '../middleware/auth.js';
import { validateQuestion, validateAnswer } from '../middleware/validator.js';

const router = Router();

router.get('/', questionController.getQuestions);
router.get('/search', questionController.searchQuestions);
router.get('/similar', questionController.getSimilarQuestions);

router.post('/', authenticateOptional, validateQuestion, questionController.createQuestion);

router.get('/:id', questionController.getQuestion);
router.put('/:id', authenticateOptional, questionController.updateQuestion);
router.delete('/:id', authenticateOptional, questionController.deleteQuestion);

router.post('/:id/urgent', authenticateOptional, questionController.markUrgent);
router.post('/:id/save', authenticateOptional, questionController.toggleSaved);
router.post('/:id/report', authenticateOptional, questionController.reportQuestion);

// Nested answer routes matching frontend conventions
router.get('/:id/answers', answerController.getAnswers);
router.post('/:id/answers', authenticateOptional, validateAnswer, answerController.createAnswer);

export default router;
