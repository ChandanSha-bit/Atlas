import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User';

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, undefined);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
      proxy: true,
      scope: ['profile', 'email'],
    },
    async (_accessToken: string, _refreshToken: string, profile: any, done: (error: any, user?: any) => void) => {
      try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

        if (!email) {
          return done(new Error('No email found in Google profile'), undefined);
        }

        // Check by providerId first (linking case)
        let user = await User.findOne({ 'linkedAccounts.providerId': profile.id });

        // Then check by email
        if (!user) {
          user = await User.findOne({ email });
        }

        if (user) {
          // Link this provider if not already linked
          const alreadyLinked = user.linkedAccounts?.some(
            (a: any) => a.providerId === profile.id
          );
          if (!alreadyLinked) {
            user.linkedAccounts = [
              ...(user.linkedAccounts || []),
              { provider: 'google', providerId: profile.id, linkedAt: new Date() },
            ];
          }
          if (profile.photos && profile.photos[0] && !user.avatarUrl) {
            user.avatarUrl = profile.photos[0].value;
          }
          await user.save();
          return done(null, user);
        }

        user = await User.create({
          name: profile.displayName || 'Atlas User',
          email,
          password: Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-8),
          avatarUrl: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
          bio: 'Joined Atlas via Google',
          provider: 'google',
          providerId: profile.id,
          linkedAccounts: [{ provider: 'google', providerId: profile.id, linkedAt: new Date() }],
        });

        done(null, user);
      } catch (error) {
        done(error, undefined);
      }
    }
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/github/callback`,
      scope: ['user:email'],
    },
    async (_accessToken: string, _refreshToken: string, profile: any, done: (error: any, user?: any) => void) => {
      try {
        let email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

        if (!email) {
          email = `${profile.username}@github.atlas.ai`;
        }

        // Check by providerId first (linking case)
        let user = await User.findOne({ 'linkedAccounts.providerId': profile.id });

        // Then check by email
        if (!user) {
          user = await User.findOne({ email });
        }

        if (user) {
          const alreadyLinked = user.linkedAccounts?.some(
            (a: any) => a.providerId === profile.id
          );
          if (!alreadyLinked) {
            user.linkedAccounts = [
              ...(user.linkedAccounts || []),
              { provider: 'github', providerId: profile.id, linkedAt: new Date() },
            ];
          }
          if (profile.photos && profile.photos[0] && !user.avatarUrl) {
            user.avatarUrl = profile.photos[0].value;
          }
          await user.save();
          return done(null, user);
        }

        user = await User.create({
          name: profile.displayName || profile.username || 'Atlas User',
          email,
          password: Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-8),
          avatarUrl: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
          bio: 'Joined Atlas via GitHub',
          provider: 'github',
          providerId: profile.id,
          linkedAccounts: [{ provider: 'github', providerId: profile.id, linkedAt: new Date() }],
        });

        done(null, user);
      } catch (error) {
        done(error, undefined);
      }
    }
  )
);

export default passport;
