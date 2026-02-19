/**
 * Environment Variable Validation
 *
 * Validates required and optional environment variables at runtime
 * Prevents application startup with missing critical configuration
 */

interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface EnvConfig {
  required: {
    key: string;
    description: string;
    validation?: (value: string) => boolean;
  }[];
  optional: {
    key: string;
    description: string;
    defaultValue?: string;
  }[];
}

const ENV_CONFIG: EnvConfig = {
  required: [
    {
      key: 'DATABASE_URL',
      description: 'PostgreSQL database connection URL',
      validation: (value) => value.startsWith('postgres://') || value.startsWith('postgresql://'),
    },
    {
      key: 'NEXTAUTH_SECRET',
      description: 'NextAuth.js secret for session encryption (min 32 characters)',
      validation: (value) => value.length >= 32,
    },
    {
      key: 'NEXTAUTH_URL',
      description: 'Application base URL for NextAuth.js callbacks',
      validation: (value) => value.startsWith('http://') || value.startsWith('https://'),
    },
    {
      key: 'ENCRYPTION_KEY',
      description: 'Encryption key for sensitive data (min 32 characters)',
      validation: (value) => value.length >= 32,
    },
    {
      key: 'GITHUB_ID',
      description: 'GitHub OAuth App Client ID',
    },
    {
      key: 'GITHUB_SECRET',
      description: 'GitHub OAuth App Client Secret',
    },
  ],
  optional: [
    {
      key: 'GITHUB_CLIENT_ID',
      description: 'GitHub OAuth Client ID (for repository access)',
    },
    {
      key: 'GITHUB_CLIENT_SECRET',
      description: 'GitHub OAuth Client Secret (for repository access)',
    },
    {
      key: 'GITHUB_REDIRECT_URI',
      description: 'GitHub OAuth redirect URI',
    },
    {
      key: 'GITHUB_TOKEN',
      description: 'GitHub Personal Access Token (fallback)',
    },
    {
      key: 'NEXT_PUBLIC_SENTRY_DSN',
      description: 'Sentry DSN for error tracking',
    },
    {
      key: 'RATE_LIMIT_ENABLED',
      description: 'Enable API rate limiting',
      defaultValue: 'true',
    },
    {
      key: 'NODE_ENV',
      description: 'Node environment',
      defaultValue: 'development',
    },
  ],
};

/**
 * Validate environment variables
 * @returns Validation result with errors and warnings
 */
export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const config of ENV_CONFIG.required) {
    const value = process.env[config.key];

    if (!value || value.trim() === '') {
      errors.push(`❌ Missing required environment variable: ${config.key}`);
      errors.push(`   Description: ${config.description}`);
      continue;
    }

    // Run validation if provided
    if (config.validation && !config.validation(value)) {
      errors.push(`❌ Invalid value for environment variable: ${config.key}`);
      errors.push(`   Description: ${config.description}`);
    }
  }

  // Check optional variables
  for (const config of ENV_CONFIG.optional) {
    const value = process.env[config.key];

    if (!value || value.trim() === '') {
      if (config.defaultValue) {
        warnings.push(
          `⚠️  Optional variable ${config.key} not set, using default: ${config.defaultValue}`
        );
      } else {
        warnings.push(`ℹ️  Optional variable ${config.key} not set`);
        warnings.push(`   Description: ${config.description}`);
      }
    }
  }

  // Check GitHub integration completeness
  const hasGitHubClientId = !!process.env.GITHUB_CLIENT_ID;
  const hasGitHubClientSecret = !!process.env.GITHUB_CLIENT_SECRET;
  const hasGitHubRedirectUri = !!process.env.GITHUB_REDIRECT_URI;

  if (hasGitHubClientId || hasGitHubClientSecret || hasGitHubRedirectUri) {
    if (!hasGitHubClientId || !hasGitHubClientSecret || !hasGitHubRedirectUri) {
      warnings.push(
        '⚠️  GitHub integration incomplete: Set GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and GITHUB_REDIRECT_URI together'
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate environment and throw if invalid (for production)
 */
export function validateEnvironmentOrThrow(): void {
  const result = validateEnvironment();

  if (!result.valid) {
    console.error('\n🚨 Environment Validation Failed:\n');
    result.errors.forEach((error) => console.error(error));

    if (result.warnings.length > 0) {
      console.warn('\n⚠️  Warnings:\n');
      result.warnings.forEach((warning) => console.warn(warning));
    }

    throw new Error('Environment validation failed. Check logs above for details.');
  }

  if (result.warnings.length > 0 && process.env.NODE_ENV === 'production') {
    console.warn('\n⚠️  Environment Warnings:\n');
    result.warnings.forEach((warning) => console.warn(warning));
  }
}

/**
 * Log environment validation results (for development)
 */
export function logEnvironmentStatus(): void {
  const result = validateEnvironment();

  if (result.valid) {
    console.log('✅ Environment validation passed');

    if (result.warnings.length > 0) {
      console.warn('\n⚠️  Warnings:\n');
      result.warnings.forEach((warning) => console.warn(warning));
    }
  } else {
    console.error('\n🚨 Environment Validation Failed:\n');
    result.errors.forEach((error) => console.error(error));

    if (result.warnings.length > 0) {
      console.warn('\n⚠️  Warnings:\n');
      result.warnings.forEach((warning) => console.warn(warning));
    }
  }
}

/**
 * Get environment variable with fallback
 */
export function getEnvVar(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

/**
 * Check if environment variable is set and non-empty
 */
export function hasEnvVar(key: string): boolean {
  const value = process.env[key];
  return !!value && value.trim() !== '';
}

/**
 * Get required environment variable or throw
 */
export function getRequiredEnvVar(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
