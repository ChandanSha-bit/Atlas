import type { IUserDocument } from '../models/User';

declare global {
  namespace Express {
    interface User extends IUserDocument {}
    interface Request {
      requestId?: string;
    }
  }
}

export {};
