import { Router } from 'express';
import { voteController } from '../controllers/voteController.js';
import { authenticateOptional } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticateOptional, voteController.vote);

export default router;
