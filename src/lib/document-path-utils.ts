import { prisma } from '@/lib/prisma';

export class DocumentPathConflictError extends Error {
  constructor(path: string) {
    super(`A document with this name already exists at path: ${path}`);
    this.name = 'DocumentPathConflictError';
  }
}

export function toPathSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function buildDocumentPath(phase: string, type: string, title: string) {
  return `/${toPathSlug(phase)}/${toPathSlug(type)}/${toPathSlug(title)}`;
}

export async function generateUniqueDocumentPath(options: {
  workspaceId: string;
  phase: string;
  type: string;
  title: string;
  excludeDocumentId?: string;
}) {
  const { workspaceId, phase, type, title, excludeDocumentId } = options;

  const basePath = buildDocumentPath(phase, type, title);

  const baseConflict = await prisma.document.findFirst({
    where: {
      workspaceId,
      path: basePath,
      ...(excludeDocumentId ? { id: { not: excludeDocumentId } } : {}),
    },
    select: { id: true },
  });

  if (baseConflict) {
    throw new DocumentPathConflictError(basePath);
  }

  return basePath;
}

export async function assertDocumentPathAvailable(options: {
  workspaceId: string;
  path: string;
  excludeDocumentId?: string;
}) {
  const { workspaceId, path, excludeDocumentId } = options;

  const conflict = await prisma.document.findFirst({
    where: {
      workspaceId,
      path,
      ...(excludeDocumentId ? { id: { not: excludeDocumentId } } : {}),
    },
    select: { id: true },
  });

  if (conflict) {
    throw new DocumentPathConflictError(path);
  }
}
