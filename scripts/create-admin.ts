import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createAdminUser() {
  console.log('\n🔐 Admin User Setup\n');
  console.log('This script will create an admin user for the system.\n');

  try {
    // Get admin details
    const email = await question('Enter admin email: ');
    const name = await question('Enter admin name: ');
    const password = await question('Enter admin password: ');

    if (!email || !password) {
      console.error('\n❌ Email and password are required!');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`\n⚠️  User with email ${email} already exists.`);
      const makeAdmin = await question('Do you want to promote this user to admin? (yes/no): ');
      
      if (makeAdmin.toLowerCase() === 'yes') {
        await prisma.user.update({
          where: { email },
          data: { role: 'ADMIN' },
        });
        console.log(`\n✅ User ${email} has been promoted to admin!`);
      } else {
        console.log('\n❌ Operation cancelled.');
      }
      rl.close();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('\nAdmin Details:');
    console.log(`  Email: ${adminUser.email}`);
    console.log(`  Name: ${adminUser.name || 'N/A'}`);
    console.log(`  Role: ${adminUser.role}`);
    console.log('\nYou can now log in at: http://localhost:3000/admin/login\n');

  } catch (error) {
    console.error('\n❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser();
