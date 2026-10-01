import { Router } from 'express';
import { mentorController } from '../controllers/mentorController.js';

const router = Router();

router.get('/', mentorController.getMentors);
router.get('/route', mentorController.getRecommended);
router.get('/:id', mentorController.getMentor);

export default router;
