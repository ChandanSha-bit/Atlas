import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ILinkedAccount {
  provider: 'google' | 'github';
  providerId: string;
  linkedAt: Date;
}

export interface IUserDocument extends Document {
  _id: Types.ObjectId;
  id: string;
  name: string;
  email: string;
  bio: string;
  avatarUrl: string;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  paymentStatus: 'active' | 'inactive' | 'canceled';
  energy: number;
  provider: 'email' | 'google' | 'github';
  providerId: string;
  linkedAccounts: ILinkedAccount[];
  password: string;
  role: 'user' | 'admin';
  createdAt: Date;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  isVerified: boolean;
  verificationToken?: string;
  verificationExpire?: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  bio: {
    type: String,
    maxlength: [200, 'Bio cannot be more than 200 characters'],
    default: 'I am using Atlas AI.',
  },
  avatarUrl: {
    type: String,
    default: '',
  },
  subscriptionTier: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free',
  },
  paymentStatus: {
    type: String,
    enum: ['active', 'inactive', 'canceled'],
    default: 'inactive',
  },
  energy: {
    type: Number,
    default: 100,
    min: 0,
    max: 100,
  },
  provider: {
    type: String,
    enum: ['email', 'google', 'github'],
    default: 'email',
  },
  providerId: {
    type: String,
    default: '',
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
  verificationExpire: Date,
  linkedAccounts: [{
    provider: { type: String, enum: ['google', 'github'], required: true },
    providerId: { type: String, required: true },
    linkedAt: { type: Date, default: Date.now },
  }],
});

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model<IUserDocument>('User', UserSchema);
