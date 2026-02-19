/**
 * Database seed script
 * Creates sample data for development
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.activity.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.version.deleteMany();
  await prisma.document.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  console.log('Creating users...');
  const password = await bcrypt.hash('password123', 10);

  const alice = await prisma.user.create({
    data: {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      password,
      emailVerified: new Date(),
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: 'Bob Smith',
      email: 'bob@example.com',
      password,
      emailVerified: new Date(),
    },
  });

  const charlie = await prisma.user.create({
    data: {
      name: 'Charlie Davis',
      email: 'charlie@example.com',
      password,
      emailVerified: new Date(),
    },
  });

  console.log(`✓ Created 3 users`);

  // Create workspaces
  console.log('Creating workspaces...');
  const techWorkspace = await prisma.workspace.create({
    data: {
      name: 'Engineering Team',
      description: 'Technical documentation and knowledge base',
      ownerId: alice.id,
      members: {
        create: [
          {
            userId: bob.id,
            permissions: ['view_documents', 'edit_documents', 'manage_versions', 'manage_comments'],
          },
          {
            userId: charlie.id,
            permissions: ['view_documents'],
          },
        ],
      },
    },
  });

  const _productWorkspace = await prisma.workspace.create({
    data: {
      name: 'Product Team',
      description: 'Product specifications and roadmap',
      ownerId: bob.id,
      members: {
        create: [
          {
            userId: alice.id,
            permissions: ['view_documents', 'edit_documents', 'manage_versions', 'manage_comments'],
          },
        ],
      },
    },
  });

  console.log(`✓ Created 2 workspaces`);

  // Create documents
  console.log('Creating documents...');
  const gettingStarted = await prisma.document.create({
    data: {
      title: 'Getting Started Guide',
      content:
        '# Getting Started\\n\\nWelcome to DocHub! This guide will help you get started.',
      path: '/getting-started',
      workspaceId: techWorkspace.id,
      authorId: alice.id,
      status: 'PUBLISHED',
    },
  });

  const apiDocs = await prisma.document.create({
    data: {
      title: 'API Documentation',
      content:
        '# API Documentation\\n\\n## Authentication\\n\\nAll API requests require authentication using JWT tokens.',
      path: '/api-docs',
      workspaceId: techWorkspace.id,
      authorId: bob.id,
      status: 'PUBLISHED',
    },
  });

  console.log(`✓ Created 2 documents`);

  // Create document versions
  console.log('Creating document versions...');
  await prisma.version.create({
    data: {
      documentId: gettingStarted.id,
      version: 1,
      content: gettingStarted.content,
      authorId: alice.id,
      message: 'Initial version',
    },
  });

  await prisma.version.create({
    data: {
      documentId: apiDocs.id,
      version: 1,
      content: apiDocs.content,
      authorId: bob.id,
      message: 'Initial API documentation',
    },
  });

  console.log('✓ Created document versions');

  // Create activities
  console.log('Creating activities...');
  await prisma.activity.create({
    data: {
      type: 'DOCUMENT_CREATED',
      actorId: alice.id,
      workspaceId: techWorkspace.id,
      entityType: 'document',
      entityId: gettingStarted.id,
    },
  });

  await prisma.activity.create({
    data: {
      type: 'DOCUMENT_CREATED',
      actorId: bob.id,
      workspaceId: techWorkspace.id,
      entityType: 'document',
      entityId: apiDocs.id,
    },
  });

  console.log('✓ Created activities');

  console.log('\\n✅ Database seed completed successfully!');
  console.log('\\nSample credentials:');
  console.log('- alice@example.com / password123 (Owner of Engineering Team)');
  console.log('- bob@example.com / password123 (Owner of Product Team)');
  console.log('- charlie@example.com / password123 (Member)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
