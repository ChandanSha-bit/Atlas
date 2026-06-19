import { Request, Response } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail';
import logger from '../utils/logger';
import { getCache, setCache, delCache } from '../config/redis';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRE as any,
  });
};

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({ name, email, password });

    if (user) {
      const verificationToken = crypto.randomBytes(32).toString('hex');
      user.verificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
      user.verificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await user.save({ validateBeforeSave: false });

      const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

      try {
        await sendEmail({
          email: user.email,
          subject: 'Axiora — Verify Your Email',
          message: `Welcome to Axiora! Please verify your email by clicking: ${verifyUrl}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="text-align: center; padding: 40px 0 20px;">
                <div style="width: 60px; height: 60px; border-radius: 50%; background: #1b1c1a; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                  <span style="color: white; font-size: 28px;">✦</span>
                </div>
                <h1 style="color: #1b1c1a; font-size: 24px; margin: 0;">Verify Your Email</h1>
              </div>
              <p style="color: #555; font-size: 15px; line-height: 1.6; text-align: center; padding: 0 20px;">
                Welcome to Axiora, <strong>${user.name}</strong>! Click the button below to verify your email address and activate your account.
              </p>
              <div style="text-align: center; padding: 24px 0;">
                <a href="${verifyUrl}" style="display: inline-block; padding: 14px 36px; background-color: #1b1c1a; color: white; text-decoration: none; border-radius: 12px; font-size: 15px; font-weight: bold;">Verify Email</a>
              </div>
              <p style="color: #999; font-size: 13px; text-align: center;">
                This link expires in 24 hours. If you didn't create an Axiora account, please ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #999; font-size: 12px; text-align: center;">Axiora AI — Your Creative Partner</p>
            </div>
          `
        });
      } catch {
        logger.error('Verification email failed to send');
      }

      res.status(201).json({
        success: true,
        message: 'Account created. Please check your email to verify your account.',
        token: generateToken(user._id.toString()),
        user: { _id: user._id, name: user.name, email: user.email, bio: user.bio, avatarUrl: user.avatarUrl, provider: user.provider, isVerified: user.isVerified },
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in. Check your inbox for the verification link.',
        needsVerification: true,
        email: user.email,
      });
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id.toString()),
      user: { _id: user._id, name: user.name, email: user.email, bio: user.bio, avatarUrl: user.avatarUrl, provider: user.provider, isVerified: user.isVerified },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const cacheKey = `user:${req.user!._id}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }
    const result = { success: true, data: req.user };
    await setCache(cacheKey, JSON.stringify(result), 300);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const verificationToken = crypto
      .createHash('sha256')
      .update(req.params.token as string)
      .digest('hex');

    const user = await User.findOne({
      verificationToken,
      verificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id.toString());

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        subscriptionTier: user.subscriptionTier,
        energy: user.energy,
        provider: user.provider,
        isVerified: user.isVerified,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resendVerification = async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No user found with that email' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    user.verificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await sendEmail({
      email: user.email,
      subject: 'Axiora — Verify Your Email',
      message: `Please verify your email by clicking: ${verifyUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 40px 0 20px;">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: #1b1c1a; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <span style="color: white; font-size: 28px;">✦</span>
            </div>
            <h1 style="color: #1b1c1a; font-size: 24px; margin: 0;">Verify Your Email</h1>
          </div>
          <p style="color: #555; font-size: 15px; line-height: 1.6; text-align: center; padding: 0 20px;">
            Click the button below to verify your email address.
          </p>
          <div style="text-align: center; padding: 24px 0;">
            <a href="${verifyUrl}" style="display: inline-block; padding: 14px 36px; background-color: #1b1c1a; color: white; text-decoration: none; border-radius: 12px; font-size: 15px; font-weight: bold;">Verify Email</a>
          </div>
          <p style="color: #999; font-size: 13px; text-align: center;">
            This link expires in 24 hours.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">Axiora AI — Your Creative Partner</p>
        </div>
      `
    });

    res.status(200).json({ success: true, message: 'Verification email sent' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    await User.updateMany(
      { resetPasswordExpire: { $lt: Date.now() } },
      { $unset: { resetPasswordToken: '', resetPasswordExpire: '' } }
    );

    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'There is no user with that email' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/new-password?token=${resetToken}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Axiora Password Reset Request',
        message: `You are receiving this email because you (or someone else) has requested the reset of a password. Please click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1b1c1a;">Password Reset Request</h1>
            <p>You are receiving this email because you (or someone else) has requested to reset your Axiora account password.</p>
            <p>Please click the button below to reset your password:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #1b1c1a; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Reset Password</a>
            <p style="color: #666; font-size: 14px;">This link will expire in 10 minutes.</p>
            <p style="color: #666; font-size: 14px;">If you did not request this, please ignore this email and your password will remain unchanged.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">Axiora AI - Your Creative Partner</p>
          </div>
        `
      });

      res.status(200).json({ success: true, message: 'Password reset email sent' });
    } catch {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken as string)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = generateToken(user._id.toString());

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        subscriptionTier: user.subscriptionTier,
        energy: user.energy,
        provider: user.provider
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
