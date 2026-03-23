import { prisma } from '@/lib/prisma';

export class DocumentPathConflictError extends Error {
  constructor(path: string) {
    super(`A document already exists at path: ${path}`);
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

/**
 * Sanitize a user-supplied custom path:
 * - Splits on slashes, slugifies each segment, drops empty segments
 * - Always returns a leading slash, no trailing slash
 * - e.g. " /Onboarding / My SOP! " → "/onboarding/my-sop"
 */
export function sanitizeCustomPath(raw: string): string {
  const segments = raw
    .split('/')
    .map((s) => toPathSlug(s.trim()))
    .filter(Boolean);
  return '/' + segments.join('/');
}

/**
 * Validate a (already-sanitized or user-typed) custom path.
 * Returns an error string, or null if valid.
 */
export function validateCustomPath(path: string): string | null {
  const sanitized = sanitizeCustomPath(path);
  const segments = sanitized.split('/').filter(Boolean);
  if (segments.length === 0) return 'Path cannot be empty';
  if (segments.length > 10) return 'Path cannot have more than 10 segments';
  for (const seg of segments) {
    if (seg.length > 100) return `Segment "${seg}" exceeds 100 characters`;
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(seg))
      return `Invalid segment "${seg}": use lowercase letters, numbers, and hyphens only`;
  }
  return null;
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
