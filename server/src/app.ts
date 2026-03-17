import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { setupSwagger } from './config/swagger';
import { httpLogger } from './lib/logger';
import { errorHandler, generalLimiter, sanitize } from './middlewares';

// Module routes
import authRoutes from './modules/auth/routes';
import usersRoutes from './modules/users/routes';
import categoriesRoutes from './modules/categories/routes';
import ticketsRoutes from './modules/tickets/routes';
import commentsRoutes from './modules/comments/routes';
import attachmentsRoutes from './modules/attachments/routes';
import { attachmentDownloadRouter } from './modules/attachments/routes';
import dashboardRoutes from './modules/dashboard/routes';
import notificationRoutes from './modules/notifications/routes';

const app = express();

// ─── Trust Proxy (for rate limiter behind reverse proxy) ────
app.set('trust proxy', 1);

// ─── Security Headers ──────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],  // Prevent clickjacking
    },
  },
  crossOriginEmbedderPolicy: false, // Allow fonts from Google
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

// ─── CORS (whitelist client origin) ─────────────────────────
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,              // Allow cookies (refresh token)
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parsing ───────────────────────────────────────────
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Input Sanitization (XSS protection) ────────────────
app.use(sanitize);

// ─── Logging ────────────────────────────────────────────
app.use(httpLogger);

// ─── Rate Limiter ───────────────────────────────────────
app.use('/api', generalLimiter);

// ─── Swagger (development only) ─────────────────────────
setupSwagger(app);

// ─── Health Check ───────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ─────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/tickets/:ticketId/comments', commentsRoutes);
app.use('/api/tickets/:ticketId/attachments', attachmentsRoutes);
app.use('/api/attachments', attachmentDownloadRouter);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

// ─── 404 Handler ────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ─── Global Error Handler ───────────────────────────────
app.use(errorHandler);

export default app;
