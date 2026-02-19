import { PrismaClient, NotificationType } from '@prisma/client';
import { NotificationService } from '../src/lib/notifications';

const prisma = new PrismaClient();

async function testFeedbackNotification() {
  console.log('🧪 Testing feedback notification helper');

  try {
    // Ensure there is at least one admin user
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

    // Create a feedback row to reference
    const feedback = await prisma.feedback.create({
      data: {
        title: 'Integration test feedback',
        description: 'This is a test feedback created by automated test script',
        userId: admin.id,
      },
    });

    // Call helper
    await NotificationService.notifyFeedbackReceived(
      admin.id,
      feedback.title,
      feedback.id,
      'integration-user@example.com'
    );

    // Verify notification exists
    const notif = await prisma.notification.findFirst({
      where: { userId: admin.id, type: 'FEEDBACK_RECEIVED' },
      orderBy: { createdAt: 'desc' },
    });

    if (!notif) {
      throw new Error('Notification not created');
    }

    console.log('✅ Feedback notification created:', notif.id);
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

// Run test
if (require.main === module) {
  testFeedbackNotification();
}
