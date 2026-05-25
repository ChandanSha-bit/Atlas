import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { delCache } from '../config/redis';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRE as any,
  });
};

const handleCallback = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }

  const token = generateToken(req.user._id.toString());
  const userData = JSON.stringify({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    bio: req.user.bio,
    avatarUrl: req.user.avatarUrl,
    subscriptionTier: req.user.subscriptionTier,
    energy: req.user.energy,
    provider: req.user.provider,
    linkedAccounts: req.user.linkedAccounts,
  });

  // Check if linking mode (redirect back to settings)
  const isLink = (req.query.state as string) === 'link';
  if (isLink) {
    await delCache(`user:${req.user._id}`);
    return res.redirect(`${process.env.FRONTEND_URL}/settings?linked=true&t=${token}`);
  }

  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(userData)}`);
};

export const googleCallback = (req: Request, res: Response) => handleCallback(req, res);
export const githubCallback = (req: Request, res: Response) => handleCallback(req, res);

export const oauthFailure = (req: Request, res: Response) => {
  res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
};

export const unlinkProvider = async (req: Request, res: Response) => {
  try {
    const provider = req.params.provider as string;
    if (!['google', 'github'].includes(provider)) {
      return res.status(400).json({ success: false, message: 'Invalid provider' });
    }

    const user = await User.findById(req.user!._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Don't allow unlinking the primary provider if it's the only login method
    if (user.provider === provider && user.password && user.provider !== 'email') {
      const otherLinked = user.linkedAccounts?.filter((a: any) => a.provider !== provider);
      if (!otherLinked || otherLinked.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot unlink your only login method. Set a password or link another provider first.',
        });
      }
    }

    user.linkedAccounts = user.linkedAccounts?.filter((a: any) => a.provider !== provider) || [];

    // If unlinking the primary provider, switch to next available
    if (user.provider === provider && user.linkedAccounts.length > 0) {
      user.provider = user.linkedAccounts[0].provider;
      user.providerId = user.linkedAccounts[0].providerId;
    }

    await user.save();
    await delCache(`user:${user._id}`);

    res.status(200).json({ success: true, data: { linkedAccounts: user.linkedAccounts, provider: user.provider } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
