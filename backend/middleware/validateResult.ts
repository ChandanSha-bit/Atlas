import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const validateResult = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array().map(e => e.msg).join(', '),
    });
  }
  next();
};

export default validateResult;
