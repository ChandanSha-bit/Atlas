import { Request, Response } from 'express';
import Groq from 'groq-sdk';
import Chat from '../models/Chat';
import User from '../models/User';
import logger from '../utils/logger';
import { getCache, setCache, delCache, clearPattern } from '../config/redis';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { message, chatId } = req.body;
    const user = req.user!;
    const currentEnergy = user.energy ?? 100;

    if (user.subscriptionTier === 'free' && currentEnergy < 2) {
      return res.status(403).json({
        success: false,
        message: 'Neural energy depleted. Upgrade to Pro for unlimited synthesis.',
      });
    }

    let chat;
    if (chatId) {
      chat = await Chat.findById(chatId);
      if (!chat) {
        return res.status(404).json({ success: false, message: 'Chat session not found.' });
      }
    } else {
      chat = await Chat.create({ user: user._id, messages: [] });
    }

    chat.messages.push({ role: 'user', content: message });

    if (chat.messages.length === 1) {
      chat.title = message.length > 60 ? message.slice(0, 57) + '...' : message;
    }

    const completion = await groq.chat.completions.create({
      messages: chat.messages
        .filter((m: any) => m.type !== 'image')
        .map((m: any) => ({ role: m.role, content: m.content })),
      model: 'llama-3.3-70b-versatile',
    });

    const aiMessage = completion.choices[0]?.message?.content || '';
    chat.messages.push({ role: 'assistant', content: aiMessage });
    chat.lastActive = new Date();
    await chat.save();

    await clearPattern(`chats:${user._id}:*`);
    await delCache(`chat:${chat._id}`);

    let newEnergy = currentEnergy;
    if (user.subscriptionTier === 'free') {
      const updated = await User.findByIdAndUpdate(
        user._id,
        { $inc: { energy: -2 } },
        { returnDocument: 'after', select: 'energy' }
      );
      newEnergy = updated?.energy ?? currentEnergy - 2;
    }

    res.status(200).json({ success: true, data: chat, energy: newEnergy });
  } catch (error: any) {
    logger.error(`sendMessage error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserChats = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 30));
    const skip = (page - 1) * limit;
    const cacheKey = `chats:${req.user!.id}:${page}:${limit}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    const [chats, total] = await Promise.all([
      Chat.find({ user: req.user!.id })
        .sort({ lastActive: -1 })
        .skip(skip)
        .limit(limit),
      Chat.countDocuments({ user: req.user!.id }),
    ]);

    const result = {
      success: true,
      count: chats.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: chats,
    };

    await setCache(cacheKey, JSON.stringify(result), 60);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getChatById = async (req: Request, res: Response) => {
  try {
    const cacheKey = `chat:${req.params.id}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    const chat = await Chat.findById(req.params.id);
    if (!chat || chat.user.toString() !== req.user!.id) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    const result = { success: true, data: chat };
    await setCache(cacheKey, JSON.stringify(result), 60);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteChat = async (req: Request, res: Response) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat || chat.user.toString() !== req.user!.id) {
      return res.status(404).json({ success: false, message: 'Chat not found or access denied.' });
    }
    await Chat.findByIdAndDelete(req.params.id);

    await clearPattern(`chats:${req.user!.id}:*`);
    await delCache(`chat:${req.params.id}`);

    res.status(200).json({ success: true, message: 'Conversation deleted.' });
  } catch (error: any) {
    logger.error(`deleteChat error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const renameChat = async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }

    const chat = await Chat.findById(req.params.id);
    if (!chat || chat.user.toString() !== req.user!.id) {
      return res.status(404).json({ success: false, message: 'Chat not found or access denied.' });
    }

    chat.title = title.trim();
    await chat.save();

    await clearPattern(`chats:${req.user!.id}:*`);
    await delCache(`chat:${chat._id}`);

    res.status(200).json({ success: true, data: chat });
  } catch (error: any) {
    logger.error(`renameChat error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveImageMessage = async (req: Request, res: Response) => {
  try {
    const { prompt, imageUrl, chatId } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat || chat.user.toString() !== req.user!.id) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    chat.messages.push({ role: 'user', content: prompt });
    chat.messages.push({ role: 'assistant', content: 'Generated image', type: 'image', imageUrl });
    chat.lastActive = new Date();
    await chat.save();

    await delCache(`chat:${chatId}`);

    res.status(200).json({ success: true, data: chat });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
