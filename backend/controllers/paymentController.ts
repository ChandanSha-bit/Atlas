import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User';

let razorpay: Razorpay;
const getRazorpay = () => {
  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return razorpay;
};

export const createRazorpayOrder = async (req: Request, res: Response) => {
  try {
    const { amount, planId } = req.body;

    const options = {
      amount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: req.user!.id,
        planId,
      },
    };

    const order = await getRazorpay().orders.create(options);
    res.status(200).json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyRazorpayPayment = async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      await User.findByIdAndUpdate(req.user!.id, {
        subscriptionTier: planId,
        paymentStatus: 'active'
      });

      res.status(200).json({ success: true, message: 'Payment verified and account upgraded' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid signature. Security alert!' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const razorpayWebhook = async (req: Request, res: Response) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;

    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest === req.headers['x-razorpay-signature']) {
      const event = req.body.event;

      if (event === 'payment.captured') {
        const { userId, planId } = req.body.payload.payment.entity.notes;
        await User.findByIdAndUpdate(userId, {
          subscriptionTier: planId,
          paymentStatus: 'active'
        });
      }

      res.status(200).json({ status: 'ok' });
    } else {
      res.status(400).json({ status: 'invalid signature' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
