import { PrismaClient } from '@prisma/client';
import { sign } from 'jsonwebtoken';
import { isAdminByUserIdOrToken } from '../src/lib/admin-utils';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

async function run() {
  console.log('🧪 Testing admin-utils helper');

  try {
    // Ensure admin user exists
    let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: 'integration-admin@example.com',
          name: 'Integration Admin',
          password: 'placeholder',
          role: 'ADMIN',
        },
      });
    }

    // Ensure regular user exists
    let user = await prisma.user.findFirst({ where: { role: 'USER' } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'integration-user@example.com',
          name: 'Integration User',
          password: 'placeholder',
          role: 'USER',
        },
      });
    }

    // Test by userId
    const byAdminId = await isAdminByUserIdOrToken(admin.id, null);
    if (!byAdminId) throw new Error('Expected admin userId to be recognized as admin');

    const byUserId = await isAdminByUserIdOrToken(user.id, null);
    if (byUserId) throw new Error('Expected regular userId NOT to be recognized as admin');

    // Test by token
    const token = sign({ userId: admin.id, isAdmin: true }, JWT_SECRET, { expiresIn: '1h' });
    const byToken = await isAdminByUserIdOrToken(null, token);
    if (!byToken) throw new Error('Expected valid admin token to be recognized as admin');

    // Invalid token should fail
    const invalid = await isAdminByUserIdOrToken(null, 'not-a-token');
    if (invalid) throw new Error('Invalid token should NOT be recognized as admin');

    console.log('✅ admin-utils tests passed');
  } catch (err) {
    console.error('❌ admin-utils tests failed:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) run();
