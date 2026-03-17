import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../lib/jwt';
import { UnauthorizedError, ConflictError } from '../../common/errors';
import { LoginInput, RegisterInput, UpdateProfileInput } from './schema';
import { sendVerificationEmail } from '../../lib/mailer';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function login(input: LoginInput, deviceInfo?: string, ipAddress?: string) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  if (!user || !user.isActive) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const permissions = user.role.permissions.map(rp => rp.permission.name);

  // Generate access token
  const accessToken = generateAccessToken({
    userId: user.id,
    role: user.role.name,
    permissions,
  });

  // Create session & generate refresh token
  const session = await prisma.userSession.create({
    data: {
      userId: user.id,
      tokenHash: 'pending', // Will be updated after generating token
      deviceInfo: deviceInfo || null,
      ipAddress: ipAddress || null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    sessionId: session.id,
  });

  // Update session with token hash
  await prisma.userSession.update({
    where: { id: session.id },
    data: { tokenHash: hashToken(refreshToken) },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role.name,
      permissions,
    },
  };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new ConflictError('Email already registered');
  }

  const userRole = await prisma.role.findUnique({
    where: { name: 'USER' },
  });

  if (!userRole) {
    throw new Error('USER role not found. Please run seed.');
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      password: hashedPassword,
      roleId: userRole.id,
    },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  // Send verification email
  try {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken, verificationExpiry },
    });
    await sendVerificationEmail(user.email, verificationToken);
  } catch (err) {
    console.error('[Auth] Failed to send verification email:', err);
  }

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role.name,
    permissions: user.role.permissions.map(rp => rp.permission.name),
  };
}

export async function refreshTokens(oldRefreshToken: string) {
  // Verify the token
  let payload;
  try {
    payload = verifyRefreshToken(oldRefreshToken);
  } catch {
    throw new UnauthorizedError('Invalid refresh token');
  }

  // Find session by token hash
  const tokenHash = hashToken(oldRefreshToken);
  const session = await prisma.userSession.findFirst({
    where: {
      id: payload.sessionId,
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  });

  if (!session || !session.user.isActive) {
    throw new UnauthorizedError('Session expired or revoked');
  }

  const permissions = session.user.role.permissions.map(rp => rp.permission.name);

  // Generate new tokens
  const accessToken = generateAccessToken({
    userId: session.user.id,
    role: session.user.role.name,
    permissions,
  });

  const newRefreshToken = generateRefreshToken({
    userId: session.user.id,
    sessionId: session.id,
  });

  // Rotate: update session with new token hash
  await prisma.userSession.update({
    where: { id: session.id },
    data: { tokenHash: hashToken(newRefreshToken) },
  });

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(refreshToken: string) {
  try {
    const payload = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);

    await prisma.userSession.updateMany({
      where: {
        id: payload.sessionId,
        tokenHash,
      },
      data: { revokedAt: new Date() },
    });
  } catch {
    // Silent fail — token may already be invalid
  }
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  if (!user || !user.isActive) {
    throw new UnauthorizedError('User not found or inactive');
  }

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role.name,
    permissions: user.role.permissions.map(rp => rp.permission.name),
  };
}

export async function updateProfile(userId: number, input: UpdateProfileInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new UnauthorizedError('User not found');

  const updateData: Record<string, unknown> = {};

  if (input.fullName) updateData.fullName = input.fullName;

  if (input.email && input.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictError('Email already exists');
    updateData.email = input.email;
  }

  if (input.newPassword && input.currentPassword) {
    const isValid = await bcrypt.compare(input.currentPassword, user.password);
    if (!isValid) throw new UnauthorizedError('Current password is incorrect');
    updateData.password = await bcrypt.hash(input.newPassword, 12);
  }

  if (Object.keys(updateData).length === 0) {
    return { id: user.id, fullName: user.fullName, email: user.email };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, fullName: true, email: true },
  });

  return updated;
}

export async function verifyEmail(token: string) {
  const user = await prisma.user.findFirst({
    where: {
      verificationToken: token,
      verificationExpiry: { gt: new Date() },
    },
  });

  if (!user) throw new UnauthorizedError('Invalid or expired verification token');

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      verificationToken: null,
      verificationExpiry: null,
    },
  });

  return { message: 'Email verified successfully' };
}

export async function googleLogin(user: any, deviceInfo?: string, ipAddress?: string) {
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  });

  if (!fullUser || !fullUser.isActive) {
    throw new UnauthorizedError('Account is disabled');
  }

  const permissions = fullUser.role.permissions.map(rp => rp.permission.name);

  const accessToken = generateAccessToken({
    userId: fullUser.id,
    role: fullUser.role.name,
    permissions,
  });

  const session = await prisma.userSession.create({
    data: {
      userId: fullUser.id,
      tokenHash: 'google-oauth',
      deviceInfo: deviceInfo || 'Google OAuth',
      ipAddress: ipAddress || null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const refreshToken = generateRefreshToken({
    userId: fullUser.id,
    sessionId: session.id,
  });

  // Update session with actual token hash
  await prisma.userSession.update({
    where: { id: session.id },
    data: { tokenHash: hashToken(refreshToken) },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: fullUser.id,
      fullName: fullUser.fullName,
      email: fullUser.email,
      role: fullUser.role.name,
      permissions,
    },
  };
}
