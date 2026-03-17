import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/types';
import * as authService from './service';
import { env } from '../../config/env';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

export async function login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(
      req.body,
      req.headers['user-agent'],
      req.ip
    );

    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function register(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: 'Refresh token not found',
      });
      return;
    }

    const result = await authService.refreshTokens(refreshToken);

    // Set new refresh token cookie (rotation)
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

    res.json({
      success: true,
      data: { accessToken: result.accessToken },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.clearCookie('refreshToken', { path: '/' });

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.userId);

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const updated = await authService.updateProfile(req.user!.userId, req.body);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updated },
    });
  } catch (error) {
    next(error);
  }
}
