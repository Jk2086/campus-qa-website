import { Router } from 'express';
import { answerController } from '../controllers/answerController.js';
import { authenticateOptional } from '../middleware/auth.js';

const router = Router();

router.put('/:id', authenticateOptional, answerController.updateAnswer);
router.delete('/:id', authenticateOptional, answerController.deleteAnswer);

router.post('/:id/accept', authenticateOptional, answerController.acceptAnswer);
router.post('/:id/verify', authenticateOptional, answerController.verifyAnswer);
router.post('/:id/replies', authenticateOptional, answerController.replyToAnswer);
router.post('/:id/vote', authenticateOptional, answerController.voteAnswer);
router.post('/:id/report', authenticateOptional, answerController.reportAnswer);

export default router;
