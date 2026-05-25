import express from 'express';
const router = express.Router();
import multer from 'multer';
import { updateDetails, updatePassword, uploadAvatar, deleteAccount } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const upload = multer({ dest: 'uploads/' });

router.use(protect);

router.put('/update-details', updateDetails);
router.put('/update-password', updatePassword);
router.post('/upload-avatar', upload.single('avatar'), uploadAvatar);
router.delete('/delete-account', deleteAccount);

export default router;
