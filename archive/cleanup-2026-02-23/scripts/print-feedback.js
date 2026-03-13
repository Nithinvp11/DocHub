const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.feedback.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, title: true, userId: true, status: true, createdAt: true },
  });

  console.log('Recent feedback rows:');
  rows.forEach((r) => console.log(r));
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
