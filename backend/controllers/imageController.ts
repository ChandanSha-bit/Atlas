import { Request, Response } from 'express';
import OpenAI from 'openai';
import cloudinary from '../config/cloudinary';
import User from '../models/User';
import Chat from '../models/Chat';

let _openai: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

export const generateImage = async (req: Request, res: Response) => {
  try {
    const { prompt, size = '1024x1024', quality = 'standard' } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Please provide a prompt' });
    }

    const user = req.user!;
    const currentEnergy = user.energy ?? 100;

    if (user.subscriptionTier === 'free' && currentEnergy < 10) {
      return res.status(403).json({
        success: false,
        message: 'Neural energy too low. You need at least 10 energy to generate an image.',
      });
    }

    const response = await getClient().images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: size as '1024x1024' | '1792x1024' | '1024x1792',
      quality: quality as 'standard' | 'hd',
    }).catch(async (err: any) => {
      if (err.status === 400 && err.message?.includes("does not exist")) {
        const fallback = await getClient().images.generate({
          model: "dall-e-2",
          prompt: prompt,
          n: 1,
          size: size === '1024x1024' || size === '256x256' || size === '512x512' ? size as any : '1024x1024',
        });
        return fallback;
      }
      throw err;
    });

    const tempImageUrl = response.data![0].url!;

    const uploadResponse = await cloudinary.uploader.upload(tempImageUrl, {
      folder: 'atlas_ai_generations',
      resource_type: 'image',
    });

    let newEnergy = currentEnergy;
    if (user.subscriptionTier === 'free') {
      const updated = await User.findByIdAndUpdate(
        user._id,
        { $inc: { energy: -10 } },
        { new: true, select: 'energy' }
      );
      newEnergy = updated?.energy ?? currentEnergy - 10;
    }

    res.status(200).json({
      success: true,
      data: uploadResponse.secure_url,
      energy: newEnergy,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getImageHistory = async (req: Request, res: Response) => {
  try {
    const chats = await Chat.find(
      { user: req.user!.id, 'messages.type': 'image' },
      { title: 1, 'messages.$': 1, lastActive: 1 }
    ).sort({ lastActive: -1 });

    const images = chats
      .map((chat) => {
        const imageMsgs = chat.messages.filter((m: any) => m.type === 'image');
        return imageMsgs.map((m: any) => ({
          _id: m._id,
          imageUrl: m.imageUrl,
          prompt: m.content,
          timestamp: m.timestamp,
          chatId: chat._id,
          chatTitle: chat.title,
        }));
      })
      .flat()
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.status(200).json({ success: true, count: images.length, data: images });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
