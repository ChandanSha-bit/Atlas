import express from 'express';
const router = express.Router();
import { sendMessage, getUserChats, getChatById, deleteChat, renameChat, saveImageMessage } from '../controllers/chatController';
import { protect } from '../middleware/authMiddleware';

router.route('/')
  .get(protect, getUserChats)
  .post(protect, sendMessage);

router.post('/save-image', protect, saveImageMessage);

router.route('/:id')
  .get(protect, getChatById)
  .put(protect, renameChat)
  .delete(protect, deleteChat);

export default router;
