import { prisma } from './prisma';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

export async function isAdminByUserIdOrToken(userId?: string | null, adminToken?: string | null) {
  // Check DB role first (if a userId is provided)
  if (userId) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (user?.role === 'ADMIN') return true;
    } catch {
      // ignore DB errors here; caller will handle authorization
    }
  }

  // Fallback to admin-token JWT
  if (adminToken) {
    try {
      const decoded = verify(adminToken, JWT_SECRET) as { isAdmin?: boolean };
      return !!decoded?.isAdmin;
    } catch {
      return false;
    }
  }

  return false;
}
