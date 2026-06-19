import { Request, Response } from 'express';
import User from '../models/User';
import Chat from '../models/Chat';
import cloudinary from '../config/cloudinary';
import { delCache } from '../config/redis';

export const updateDetails = async (req: Request, res: Response) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      bio: req.body.bio,
    };

    const user = await User.findByIdAndUpdate(req.user!.id, fieldsToUpdate, {
      returnDocument: 'after',
      runValidators: true,
    });

    await delCache(`user:${req.user!.id}`);

    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user!.id).select('+password');

    if (!(await user!.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user!.password = newPassword;
    await user!.save();

    await delCache(`user:${req.user!.id}`);

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    const uploadResponse = await cloudinary.uploader.upload(req.file.path, {
      folder: 'Axiora_avatars',
      resource_type: 'image',
      transformation: [
        { width: 400, height: 400, crop: 'fill' },
        { quality: 'auto' },
      ],
    });

    const user = await User.findByIdAndUpdate(
      req.user!.id,
      { avatarUrl: uploadResponse.secure_url },
      { returnDocument: 'after' }
    );

    res.status(200).json({
      success: true,
      data: { avatarUrl: uploadResponse.secure_url, user },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    await Chat.deleteMany({ user: req.user!.id });
    await User.findByIdAndDelete(req.user!.id);

    res.status(200).json({ success: true, message: 'Account and all data deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
