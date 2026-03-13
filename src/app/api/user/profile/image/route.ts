import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Image size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const imageDataUrl = `data:${file.type};base64,${buffer.toString('base64')}`;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { image: imageDataUrl },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        username: true,
        githubLinked: true,
        githubUsername: true,
        githubAvatarUrl: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error uploading profile image:', error);
    return NextResponse.json({ error: 'Failed to upload profile image' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { image: null },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        username: true,
        githubLinked: true,
        githubUsername: true,
        githubAvatarUrl: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error removing profile image:', error);
    return NextResponse.json({ error: 'Failed to remove profile image' }, { status: 500 });
  }
}
