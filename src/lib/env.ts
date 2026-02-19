import { z } from 'zod';

/**
 * Environment variable validation
 * Ensures all required environment variables are present and valid
 */

const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().url().min(1, 'DATABASE_URL is required'),

  // NextAuth
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url().optional(),

  // GitHub OAuth (optional)
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),

  // Admin Setup (optional)
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),

  // Application
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  PORT: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

/**
 * Validated environment variables
 * @throws {ZodError} If environment variables are invalid
 */
export const env: Env = envSchema.parse(process.env);

/**
 * Check if running in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Check if running in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Check if running in test
 */
export const isTest = env.NODE_ENV === 'test';

/**
 * Get database URL
 */
export const getDatabaseUrl = () => env.DATABASE_URL;

/**
 * Get app URL
 */
export const getAppUrl = () =>
  env.NEXTAUTH_URL || env.NEXT_PUBLIC_APP_URL || (isDevelopment ? 'http://localhost:3000' : '');

/**
 * Check if GitHub OAuth is configured
 */
export const isGitHubConfigured = () => Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);
