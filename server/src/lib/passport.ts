import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from './prisma';
import { env } from '../config/env';

export function initPassport() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    console.log('[Passport] Google OAuth not configured — skipping');
    return;
  }

  console.log('[Passport] Initializing Google OAuth strategy');

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          console.log('[Passport] Profile received:', profile.id, email);

          if (!email) return done(new Error('No email provided by Google'));

          // Find existing user by googleId or email
          let user = await prisma.user.findFirst({
            where: { OR: [{ googleId: profile.id }, { email }] },
          });

          if (user) {
            if (!user.googleId) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId: profile.id, isEmailVerified: true },
              });
            }
          } else {
            const userRole = await prisma.role.findFirst({ where: { name: 'USER' } });
            if (!userRole) return done(new Error('USER role not found'));

            user = await prisma.user.create({
              data: {
                fullName: profile.displayName || email.split('@')[0],
                email,
                password: '',
                roleId: userRole.id,
                isActive: true,
                googleId: profile.id,
                isEmailVerified: true,
              },
            });
          }

          console.log('[Passport] User resolved:', user.id);
          done(null, user as any);
        } catch (error) {
          console.error('[Passport] Error:', error);
          done(error as Error);
        }
      }
    )
  );
}

export default passport;
