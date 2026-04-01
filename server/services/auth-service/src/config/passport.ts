import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User';
import config from './index';
import { logger } from '../utils/logger';

passport.use(
    new GoogleStrategy(
        {
            clientID: config.google?.clientId || 'dummy-client-id',
            clientSecret: config.google?.clientSecret || 'dummy-client-secret',
            callbackURL: config.google?.callbackUrl || '/api/v1/auth/google/callback',
        },
        async (_accessToken, _refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;
                if (!email) {
                    return done(new Error('No email returned from Google'), undefined);
                }

                // Check if user already exists
                let user = await User.findOne({ email });

                if (!user) {
                    logger.info(`[OAUTH] Creating new user from Google profile: ${email}`);
                    user = await User.create({
                        fullName: profile.displayName,
                        email,
                        // Password is not used for OAuth users — set a non-usable placeholder
                        password: `google-oauth-${profile.id}`,
                        // Phone is required — generate a unique placeholder to satisfy the schema
                        phone: `00${Date.now().toString().slice(-12)}`,
                        isVerified: true,
                        googleId: profile.id,
                        role: 'customer',
                    });
                } else {
                    // Link Google account to existing user by email
                    if (!user.googleId) {
                        logger.info(`[OAUTH] Linking Google account to existing user: ${email}`);
                        user.googleId = profile.id;
                        await user.save();
                    }
                }

                return done(null, user);
            } catch (error) {
                logger.error('[OAUTH] Google strategy error:', error);
                return done(error as Error, undefined);
            }
        }
    )
);
