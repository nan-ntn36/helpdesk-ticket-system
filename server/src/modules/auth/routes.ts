import { Router, Request, Response, NextFunction } from 'express';
import * as authController from './controller';
import * as authService from './service';
import { authenticate, validate, authLimiter } from '../../middlewares';
import { loginSchema, registerSchema, updateProfileSchema } from './schema';
import passport from '../../lib/passport';
import { env } from '../../config/env';

const router = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Đăng nhập
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@helpdesk.com
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       401:
 *         description: Sai thông tin đăng nhập
 */
router.post('/login', authLimiter, validate(loginSchema), authController.login);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Đăng ký tài khoản mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, password]
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Nguyễn Văn A
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       201:
 *         description: Đăng ký thành công, email xác nhận đã được gửi
 *       409:
 *         description: Email đã tồn tại
 */
router.post('/register', authLimiter, validate(registerSchema), authController.register);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     description: Sử dụng refresh token trong cookie để lấy access token mới
 *     responses:
 *       200:
 *         description: Token mới
 *       401:
 *         description: Refresh token không hợp lệ
 */
router.post('/refresh', authController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Đăng xuất
 *     description: Xóa refresh token cookie và session
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Lấy thông tin user hiện tại
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin user
 *       401:
 *         description: Chưa đăng nhập
 */
router.get('/me', authenticate, authController.me);

/**
 * @swagger
 * /auth/profile:
 *   patch:
 *     tags: [Auth]
 *     summary: Cập nhật thông tin cá nhân
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       401:
 *         description: Chưa đăng nhập
 */
router.patch('/profile', authenticate, validate(updateProfileSchema), authController.updateProfile);

// ─── Email Verification ──────────────────────────────
router.get('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.query.token as string;
    if (!token) {
      res.status(400).json({ success: false, message: 'Token required' });
      return;
    }
    const result = await authService.verifyEmail(token);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// ─── Google OAuth (manual flow with google-auth-library) ─────
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  const { OAuth2Client } = require('google-auth-library');
  const oauth2Client = new OAuth2Client(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_CALLBACK_URL
  );

  // Step 1: Redirect user to Google consent page
  router.get('/google', (_req: Request, res: Response) => {
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email'],
      prompt: 'consent',
    });
    res.redirect(authorizeUrl);
  });

  // Step 2: Handle callback from Google
  router.get('/google/callback', async (req: Request, res: Response) => {
    // Extract code from raw URL to avoid any Express query parser issues
    const rawUrl = req.originalUrl;
    const urlObj = new URL(rawUrl, `http://${req.headers.host}`);
    const code = urlObj.searchParams.get('code');
    
    const fs = require('fs');
    fs.appendFileSync('google-oauth-debug.log', `[${new Date().toISOString()}] RAW URL: ${rawUrl}\n`);
    fs.appendFileSync('google-oauth-debug.log', `[${new Date().toISOString()}] PARSED CODE: ${code}\n`);
    fs.appendFileSync('google-oauth-debug.log', `[${new Date().toISOString()}] REQ.QUERY CODE: ${req.query.code}\n`);

    if (!code) {
      return res.redirect(`${env.CLIENT_URL}/auth/login?error=google_no_code`);
    }

    try {
      // Exchange authorization code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Get user info from Google
      const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token,
        audience: env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        return res.redirect(`${env.CLIENT_URL}/auth/login?error=google_no_email`);
      }

      // Find or create user in database
      const { prisma } = require('../../lib/prisma');
      let user = await prisma.user.findFirst({
        where: { OR: [{ googleId: payload.sub }, { email: payload.email }] },
      });

      if (user) {
        if (!user.googleId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId: payload.sub, isEmailVerified: true },
          });
        }
      } else {
        const userRole = await prisma.role.findFirst({ where: { name: 'USER' } });
        if (!userRole) {
          return res.redirect(`${env.CLIENT_URL}/auth/login?error=google_failed`);
        }
        user = await prisma.user.create({
          data: {
            fullName: payload.name || payload.email.split('@')[0],
            email: payload.email,
            password: '',
            roleId: userRole.id,
            isActive: true,
            googleId: payload.sub,
            isEmailVerified: true,
          },
        });
      }

      // Generate JWT tokens
      const result = await authService.googleLogin(user, req.headers['user-agent'], req.ip);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.redirect(`${env.CLIENT_URL}/auth/google-callback?token=${result.accessToken}`);
    } catch (error: any) {
      const fs = require('fs');
      fs.appendFileSync('google-oauth-debug.log', `[${new Date().toISOString()}] ERROR: ${error.message}\n${error.stack}\n`);
      console.error('[Google OAuth] Error:', error.message);
      res.redirect(`${env.CLIENT_URL}/auth/login?error=google_failed`);
    }
  });
}

export default router;
