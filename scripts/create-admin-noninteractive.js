const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

(async () => {
  const prisma = new PrismaClient();
  try {
    const email = 'admin@example.com';
    const password = 'Admin123!@#';
    const name = 'Admin';

    const hashed = bcrypt.hashSync(password, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        role: 'ADMIN',
        password: hashed,
        name,
        emailVerified: new Date(),
      },
      create: {
        email,
        name,
        password: hashed,
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    });

    console.log('✅ Admin user created/updated:');
    console.log(`  id: ${user.id}`);
    console.log(`  email: ${user.email}`);
    console.log(`  role: ${user.role}`);
    console.log('\nYou can log in at: http://localhost:3000/admin/login');
  } catch (err) {
    console.error('❌ Error creating admin user', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
