/**
 * Image Upload API for TipTap Editor
 * Uploads images with workspace authorization and tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import crypto from 'crypto';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'images');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

/**
 * POST /api/upload/image
 * Upload an image file with workspace authorization
 *
 * Required: workspaceId in form-data
 * Required: file in form-data
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting: 10 uploads per minute per user
    const rateLimitResult = await rateLimit(`upload-${user.id}`, 10, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many uploads',
          message: 'Please wait before uploading more images',
          resetAt: rateLimitResult.resetAt,
        },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const workspaceId = formData.get('workspaceId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    // Verify workspace membership
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: user.id,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'You are not a member of this workspace' },
        { status: 403 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file type',
          message: `Allowed types: ${ALLOWED_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: 'File too large',
          message: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 413 }
      );
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Generate unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create hash from file content for deduplication
    const hash = crypto.createHash('md5').update(buffer).digest('hex');
    const extension = file.name.split('.').pop() || 'png';
    const filename = `${hash}.${extension}`;
    const filepath = join(UPLOAD_DIR, filename);
    const url = `/uploads/images/${filename}`;

    // Check if file already exists in database (deduplication per workspace)
    let existingImage = await prisma.uploadedImage.findUnique({
      where: {
        workspaceId_hash: {
          workspaceId,
          hash,
        },
      },
    });

    if (!existingImage) {
      // Write file if not exists
      if (!existsSync(filepath)) {
        await writeFile(filepath, buffer);
        console.log(`[Image Upload] Saved new image: ${filename}`);
      }

      // Store metadata in database
      existingImage = await prisma.uploadedImage.create({
        data: {
          filename,
          url,
          size: file.size,
          contentType: file.type,
          hash,
          uploadedBy: user.id,
          workspaceId,
        },
      });

      console.log(`[Image Upload] Created database record for ${filename}`);
    } else {
      console.log(`[Image Upload] Image already exists (deduplicated): ${filename}`);
    }

    return NextResponse.json({
      url: existingImage.url,
      filename: existingImage.filename,
      size: existingImage.size,
      type: existingImage.contentType,
      id: existingImage.id,
    });
  } catch (error) {
    console.error('[Image Upload] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload image',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload/image?imageId=...
 * Delete an uploaded image (workspace members only)
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json({ error: 'imageId required' }, { status: 400 });
    }

    // Get image record
    const image = await prisma.uploadedImage.findUnique({
      where: { id: imageId },
      include: {
        workspace: {
          select: {
            ownerId: true,
            members: {
              where: { userId: user.id },
            },
          },
        },
      },
    });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Check authorization: uploader, workspace member, or workspace owner
    const isMember = image.workspace.members.length > 0;
    const isUploader = image.uploadedBy === user.id;
    const isOwner = image.workspace.ownerId === user.id;

    if (!isMember && !isUploader && !isOwner) {
      return NextResponse.json({ error: 'Not authorized to delete this image' }, { status: 403 });
    }

    // Delete file from disk
    const filepath = join(UPLOAD_DIR, image.filename);
    if (existsSync(filepath)) {
      const fs = await import('fs/promises');
      await fs.unlink(filepath);
      console.log(`[Image Upload] Deleted file: ${image.filename}`);
    }

    // Delete database record
    await prisma.uploadedImage.delete({
      where: { id: imageId },
    });

    console.log(`[Image Upload] Deleted image record: ${imageId}`);

    return NextResponse.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('[Image Upload] Delete error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete image',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
