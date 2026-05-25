import mongoose from 'mongoose';
import logger from '../utils/logger';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI!);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error: any) {
    logger.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
