import express from 'express';
const router = express.Router();
import { generateImage, getImageHistory } from '../controllers/imageController';
import { protect } from '../middleware/authMiddleware';

router.post('/generate', protect, generateImage);
router.get('/history', protect, getImageHistory);

export default router;
