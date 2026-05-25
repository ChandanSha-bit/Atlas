import express from 'express';
const router = express.Router();
import { createRazorpayOrder, verifyRazorpayPayment, razorpayWebhook } from '../controllers/paymentController';
import { protect } from '../middleware/authMiddleware';

router.post('/razorpay/create-order', protect, createRazorpayOrder);
router.post('/razorpay/verify', protect, verifyRazorpayPayment);
router.post('/razorpay/webhook', razorpayWebhook);

export default router;
