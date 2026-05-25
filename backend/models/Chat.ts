import mongoose, { Schema, Document } from 'mongoose';

export interface IMessageSubdoc {
  _id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'text' | 'image';
  imageUrl?: string;
  timestamp?: Date;
}

export interface IChatDocument extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  messages: IMessageSubdoc[];
  lastActive: Date;
}

const ChatSchema = new Schema<IChatDocument>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    default: 'New Conversation',
  },
  messages: [
    {
      role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ['text', 'image'],
        default: 'text',
      },
      imageUrl: {
        type: String,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  lastActive: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IChatDocument>('Chat', ChatSchema);
