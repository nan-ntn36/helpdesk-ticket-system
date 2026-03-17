import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

/**
 * Session Cleanup Utility
 *
 * Removes expired and revoked sessions from the database.
 * Should be run periodically (e.g., daily cron job) or on server startup.
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await prisma.userSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },     // Expired
          { revokedAt: { not: null } },           // Revoked
        ],
      },
    });

    logger.info({ deletedCount: result.count }, 'Cleaned up expired/revoked sessions');
    return result.count;
  } catch (error) {
    logger.error({ error }, 'Failed to cleanup sessions');
    return 0;
  }
}

/**
 * Revoke all sessions for a specific user.
 * Useful when: admin deactivates user, password change, security incident.
 */
export async function revokeAllUserSessions(userId: number): Promise<number> {
  const result = await prisma.userSession.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });

  logger.info({ userId, revokedCount: result.count }, 'Revoked all sessions for user');
  return result.count;
}
