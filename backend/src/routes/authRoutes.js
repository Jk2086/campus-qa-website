import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { validateRegistration, validateLogin } from '../middleware/validator.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', validateLogin, authController.login);
router.post('/register', validateRegistration, authController.register);
router.post('/demo-login', authController.demoLogin);
router.get('/demo/:role', authController.demoLogin);
router.post('/forgot-password', authController.forgotPassword);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getMe);

export default router;
