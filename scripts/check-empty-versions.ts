#!/usr/bin/env tsx
/**
 * Script to check for empty initial versions (version = 1)
 * Run: npx tsx scripts/check-empty-versions.ts
 */

import { prisma } from '../src/lib/prisma';

async function checkEmptyVersions() {
  try {
    console.log('🔍 Checking for empty initial versions...\n');

    // Find all version 1 records with empty or very short content
    const emptyInitialVersions = await prisma.version.findMany({
      where: {
        version: 1,
        OR: [
          { content: '' },
          { content: { equals: null as any } }, // Just in case
        ],
      },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
          },
        },
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Found ${emptyInitialVersions.length} empty initial versions\n`);

    if (emptyInitialVersions.length > 0) {
      console.log('📋 Empty Initial Versions:\n');
      for (const version of emptyInitialVersions) {
        console.log(`  Document: ${version.document.title}`);
        console.log(`    Document ID: ${version.document.id}`);
        console.log(`    Version ID: ${version.id}`);
        console.log(`    Message: ${version.message}`);
        console.log(`    Created: ${version.createdAt.toISOString()}`);
        console.log(`    Author: ${version.author.name || version.author.email}`);
        console.log(
          `    Current Document Content Length: ${version.document.content.length} chars`
        );
        console.log(`    Version Content Length: ${version.content.length} chars`);
        console.log('');
      }

      // Check if there are other versions for these documents
      console.log('\n🔎 Checking for other versions of these documents...\n');
      for (const version of emptyInitialVersions) {
        const otherVersions = await prisma.version.findMany({
          where: {
            documentId: version.documentId,
            version: { gt: 1 },
          },
          orderBy: {
            version: 'asc',
          },
          select: {
            id: true,
            version: true,
            message: true,
            content: true,
            createdAt: true,
          },
        });

        console.log(`  Document: ${version.document.title}`);
        console.log(`    - Has ${otherVersions.length} additional version(s)`);
        if (otherVersions.length > 0) {
          const firstOtherVersion = otherVersions[0];
          console.log(
            `    - Version ${firstOtherVersion.version} content length: ${firstOtherVersion.content.length} chars`
          );
          console.log(`    - Can potentially backfill from version ${firstOtherVersion.version}`);
        } else {
          console.log(
            `    - ⚠️  No other versions available, can backfill from current document content`
          );
        }
        console.log('');
      }
    } else {
      console.log('✅ No empty initial versions found!');
    }

    // Also check for suspiciously short initial versions (< 10 chars)
    const shortInitialVersions = await prisma.version.findMany({
      where: {
        version: 1,
        NOT: {
          content: '',
        },
      },
      select: {
        id: true,
        documentId: true,
        content: true,
        message: true,
        document: {
          select: {
            title: true,
            content: true,
          },
        },
      },
    });

    const suspiciousVersions = shortInitialVersions.filter(
      (v) => v.content.length > 0 && v.content.length < 10
    );

    if (suspiciousVersions.length > 0) {
      console.log(
        `\n⚠️  Found ${suspiciousVersions.length} suspiciously short initial versions (< 10 chars):\n`
      );
      for (const version of suspiciousVersions) {
        console.log(`  Document: ${version.document.title}`);
        console.log(`    Content: "${version.content}"`);
        console.log(
          `    Current Document Content Length: ${version.document.content.length} chars`
        );
        console.log('');
      }
    }
  } catch (error) {
    console.error('❌ Error checking versions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmptyVersions();
