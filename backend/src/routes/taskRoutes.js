import { Router } from 'express';
import { taskController } from '../controllers/taskController.js';

const router = Router();

router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTask);

export default router;
