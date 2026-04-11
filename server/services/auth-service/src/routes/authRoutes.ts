import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { authLimiter, otpLimiter } from '../middleware/rateLimit';
import { container } from '../container/container';
import passport from 'passport';
import { AUTH_ROUTES } from '../constants/routes';
import { paymentUpload } from '../middleware/upload';

import {
    registerSchema,
    registerTenantSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
    verifyOTPSchema,
    requestOTPSchema,
    resendOTPSchema,
} from '../validators/auth';

const router = Router();
const authController = container.resolve(AuthController);

import '../config/passport';

router.get(
    AUTH_ROUTES.AUTH.GOOGLE,
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
    AUTH_ROUTES.AUTH.GOOGLE_CALLBACK,
    passport.authenticate('google', { session: false, failureRedirect: '/login-failed' }),
    authController.googleCallback
);

// Public routes
router.post(AUTH_ROUTES.AUTH.REGISTER, authLimiter, validate(registerSchema), authController.register);
router.post(AUTH_ROUTES.AUTH.REGISTER_TENANT, authLimiter, validate(registerTenantSchema), authController.registerTenant);
router.post(AUTH_ROUTES.AUTH.LOGIN, authLimiter, validate(loginSchema), authController.login);
router.post(AUTH_ROUTES.AUTH.SUPER_LOGIN, authLimiter, validate(loginSchema), authController.superLogin);
router.post(AUTH_ROUTES.AUTH.FORGOT_PASSWORD, authLimiter, validate(forgotPasswordSchema), authController.requestPasswordReset);
router.post(AUTH_ROUTES.AUTH.RESET_PASSWORD, authLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.post(AUTH_ROUTES.AUTH.REFRESH_TOKEN, authController.refreshToken);
router.post(AUTH_ROUTES.AUTH.VALIDATE_TOKEN, authController.validateToken);

// Protected routes
router.use(authenticate);
router.get(AUTH_ROUTES.AUTH.PROFILE, authController.getProfile);
router.get(AUTH_ROUTES.AUTH.MY_TENANT, authController.getMyTenant);
router.patch(AUTH_ROUTES.AUTH.MY_TENANT, authController.updateMyTenant);
router.patch(AUTH_ROUTES.AUTH.PROFILE, authController.updateProfile);
router.post(AUTH_ROUTES.AUTH.CHANGE_PASSWORD, validate(changePasswordSchema), authController.changePassword);
router.post(AUTH_ROUTES.AUTH.REQUEST_OTP, otpLimiter, validate(requestOTPSchema), authController.requestOTP);
router.post(AUTH_ROUTES.AUTH.RESEND_OTP, otpLimiter, validate(resendOTPSchema), authController.requestResendOTP);
router.post(AUTH_ROUTES.AUTH.VERIFY_OTP, validate(verifyOTPSchema), authController.verifyOTP);
router.post(AUTH_ROUTES.AUTH.LOGOUT, authController.logout);
router.get('/my-tenant/payment-requests', authController.getMyPaymentRequests);
router.patch('/my-tenant/payment-requests/:reqId/confirm', authController.confirmPayment);

// Payment proof image upload → Cloudinary
router.post(
    '/upload/payment-proof',
    authenticate,
    paymentUpload.single('file'),
    (req: any, res: any) => {
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
        res.json({ success: true, data: { url: (req.file as any).path } });
    }
);

export default router;
