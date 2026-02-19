import { PrismaClient } from '@prisma/client';
import { sign } from 'jsonwebtoken';
import { isAdminByUserIdOrToken } from '../src/lib/admin-utils';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

async function run() {
  console.log('🧪 Testing admin can view feedback');

  try {
    // Ensure admin and regular user exist
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

    // Create a feedback row as the regular user
    const fb = await prisma.feedback.create({
      data: {
        userId: user.id,
        title: 'Admin-view test feedback',
        description: 'Should be visible to admins',
        type: 'GENERAL',
      },
    });

    // Sanity: admin by userId
    const adminById = await isAdminByUserIdOrToken(admin.id, null);
    if (!adminById) throw new Error('Admin userId not recognized as admin');

    // Admin should be able to find the feedback via direct DB query
    const allFeedback = await prisma.feedback.findMany({ where: {} });
    const found = allFeedback.find((f) => f.id === fb.id);
    if (!found) throw new Error('Admin cannot see feedback in DB query');

    // Token-based admin check
    const token = sign({ userId: admin.id, isAdmin: true }, JWT_SECRET, { expiresIn: '1h' });
    const adminByToken = await isAdminByUserIdOrToken(null, token);
    if (!adminByToken) throw new Error('Admin token not recognized as admin');

    console.log('✅ Admin view test passed');
  } catch (err) {
    console.error('❌ Admin view test failed:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) run();
