import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User';

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || 'dummy-client-id',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret',
            callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/v1/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user exists
                let user = await User.findOne({ email: profile.emails![0].value });

                if (!user) {
                    // Create new user
                    user = await User.create({
                        fullName: profile.displayName,
                        email: profile.emails![0].value,
                        password: 'google-oauth-user',
                        // Generate a dummy phone if your model requires it
                        phone: (Date.now() + Math.floor(Math.random() * 1000).toString()).slice(0, 15),
                        isVerified: true,
                        googleId: profile.id,
                        role: 'customer'
                    });
                } else {
                    // Link google account to existing user by email
                    if (!user.googleId) {
                        user.googleId = profile.id;
                        await user.save();
                    }
                }

                return done(null, user);
            } catch (error) {
                return done(error as Error, undefined);
            }
        }
    )
);
