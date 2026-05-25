import express from 'express';
const router = express.Router();
import { registerUser, loginUser, getMe, verifyEmail, resendVerification, forgotPassword, resetPassword } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import authLimiter from '../middleware/authLimiter';
import { registerValidation, loginValidation, forgotPasswordValidation, resetPasswordValidation } from '../middleware/validators';
import validateResult from '../middleware/validateResult';

router.post('/register', authLimiter, registerValidation, validateResult, registerUser);
router.post('/login', authLimiter, loginValidation, validateResult, loginUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', authLimiter, forgotPasswordValidation, validateResult, resendVerification);
router.post('/forgot-password', authLimiter, forgotPasswordValidation, validateResult, forgotPassword);
router.put('/reset-password/:resetToken', authLimiter, resetPasswordValidation, validateResult, resetPassword);
router.get('/me', protect, getMe);

export default router;
