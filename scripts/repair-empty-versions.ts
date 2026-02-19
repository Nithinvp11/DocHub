#!/usr/bin/env tsx
/**
 * Script to repair empty initial versions (version = 1)
 * Run: npx tsx scripts/repair-empty-versions.ts [--dry-run]
 */

import { prisma } from '../src/lib/prisma';

const DRY_RUN = process.argv.includes('--dry-run');

async function repairEmptyVersions() {
  try {
    console.log('🔧 Starting version integrity repair...\n');
    if (DRY_RUN) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n');
    }

    // Find all version 1 records with empty or very short content
    const emptyInitialVersions = await prisma.version.findMany({
      where: {
        version: 1,
        content: '',
      },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            content: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`Found ${emptyInitialVersions.length} empty initial versions\n`);

    if (emptyInitialVersions.length === 0) {
      console.log('✅ No empty initial versions found - nothing to repair!');
      await prisma.$disconnect();
      return;
    }

    let repairedCount = 0;
    let skippedCount = 0;

    for (const version of emptyInitialVersions) {
      console.log(`\n📄 Document: "${version.document.title}"`);
      console.log(`   Version ID: ${version.id}`);
      console.log(`   Document ID: ${version.documentId}`);

      // Strategy 1: Try to find the earliest saved version (version 2+)
      const earliestSavedVersion = await prisma.version.findFirst({
        where: {
          documentId: version.documentId,
          version: { gt: 1 },
        },
        orderBy: {
          version: 'asc',
        },
        select: {
          content: true,
          version: true,
        },
      });

      let repairContent: string | null = null;

      if (earliestSavedVersion && earliestSavedVersion.content.trim().length > 0) {
        console.log(
          `   ✓ Found version ${earliestSavedVersion.version} with content (${earliestSavedVersion.content.length} chars)`
        );
        repairContent = earliestSavedVersion.content;
      } else if (version.document.content.trim().length > 0) {
        console.log(
          `   ✓ Using current document content (${version.document.content.length} chars)`
        );
        repairContent = version.document.content;
      } else {
        console.log(`   ⚠️  No valid content found - using default placeholder`);
        repairContent =
          '# Document Content Unavailable\n\nThe original content for this version could not be recovered.';
      }

      if (repairContent) {
        if (DRY_RUN) {
          console.log(`   [DRY RUN] Would update version with ${repairContent.length} chars`);
          repairedCount++;
        } else {
          await prisma.version.update({
            where: { id: version.id },
            data: { content: repairContent },
          });
          console.log(`   ✅ Repaired version with ${repairContent.length} chars`);
          repairedCount++;
        }
      } else {
        console.log(`   ❌ Skipped - no valid repair strategy`);
        skippedCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 Repair Summary:`);
    console.log(`   Total empty versions found: ${emptyInitialVersions.length}`);
    console.log(`   Successfully repaired: ${repairedCount}`);
    console.log(`   Skipped: ${skippedCount}`);

    if (DRY_RUN) {
      console.log(`\n💡 Run without --dry-run to apply these changes`);
    } else {
      console.log(`\n✅ Repair complete!`);
    }
  } catch (error) {
    console.error('\n❌ Error during repair:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

repairEmptyVersions();
