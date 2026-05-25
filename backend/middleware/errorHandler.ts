import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface MongoError extends Error {
  code?: number;
  errors?: Record<string, { message: string }>;
  statusCode?: number;
}

const errorHandler = (err: MongoError, req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Unhandled error: ${err.message}`, {
    requestId: req?.requestId,
    stack: err.stack,
  });

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map(e => e.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }

  if (err.code === 11000) {
    return res.status(400).json({ success: false, message: 'Duplicate field value' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Resource not found' });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired' });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

export default errorHandler;
