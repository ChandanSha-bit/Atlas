import express from 'express';
const router = express.Router();
import passport from 'passport';
import { googleCallback, githubCallback, oauthFailure, unlinkProvider } from '../controllers/oauthController';
import { protect } from '../middleware/authMiddleware';

// Normal OAuth login
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/api/auth/failure',
    session: false
  }),
  googleCallback
);

router.get(
  '/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get(
  '/github/callback',
  passport.authenticate('github', {
    failureRedirect: '/api/auth/failure',
    session: false
  }),
  githubCallback
);

// Account linking OAuth (same routes but with ?state=link)
router.get(
  '/link/google',
  passport.authenticate('google', { scope: ['profile', 'email'], state: 'link' })
);

router.get(
  '/link/github',
  passport.authenticate('github', { scope: ['user:email'], state: 'link' })
);

// Unlink a provider
router.post('/unlink/:provider', protect, unlinkProvider);

router.get('/failure', oauthFailure);

export default router;
