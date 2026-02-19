import { z } from 'zod';

/**
 * Centralized validation schemas for the application
 * Uses Zod for runtime type checking and validation
 */

// User schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(1, 'Name is required').max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Workspace schemas
export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
});

export const updateMemberPermissionsSchema = z.object({
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
});

// Document schemas
export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  content: z.string().default(''),
  workspaceId: z.string().uuid('Invalid workspace ID'),
  path: z.string().max(500).optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
  message: z.string().min(1, 'Commit message is required'), // Version commit message
});

// Comment schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment too long'),
});

export const resolveCommentSchema = z.object({
  commentId: z.string().uuid('Invalid comment ID'),
  resolved: z.boolean(),
});

// GitHub sync schemas
export const syncGitHubSchema = z.object({
  repoUrl: z
    .string()
    .url('Invalid repository URL')
    .refine((url) => url.includes('github.com'), 'Must be a GitHub repository URL'),
  branch: z.string().default('main'),
  path: z.string().default(''),
});

// Pagination schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Query parameter schemas
export const documentQuerySchema = z.object({
  workspaceId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
  ...paginationSchema.shape,
});

export const versionQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// Helper type extractors
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberPermissionsInput = z.infer<typeof updateMemberPermissionsSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ResolveCommentInput = z.infer<typeof resolveCommentSchema>;
export type SyncGitHubInput = z.infer<typeof syncGitHubSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type DocumentQueryInput = z.infer<typeof documentQuerySchema>;
export type VersionQueryInput = z.infer<typeof versionQuerySchema>;
