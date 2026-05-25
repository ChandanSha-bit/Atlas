import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const requestId = (req: Request, res: Response, next: NextFunction) => {
  req.requestId = crypto.randomUUID().slice(0, 8);
  res.setHeader('X-Request-Id', req.requestId);
  next();
};

export default requestId;
