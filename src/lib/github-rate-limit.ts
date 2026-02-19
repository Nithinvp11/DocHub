/**
 * GitHub API Rate Limiting and Retry Logic
 * Handles GitHub API rate limits with exponential backoff
 */

import { Octokit } from 'octokit';

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  used: number;
}

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number; // milliseconds
  maxDelay?: number; // milliseconds
  onRetry?: (attempt: number, error: unknown) => void;
}

export class GitHubRateLimiter {
  private rateLimit: RateLimitInfo | null = null;
  private readonly warningThreshold = 100; // Warn when remaining < 100

  constructor(private octokit: Octokit) {}

  /**
   * Get current rate limit status
   */
  async getRateLimit(): Promise<RateLimitInfo> {
    try {
      const { data } = await this.octokit.rest.rateLimit.get();
      const core = data.resources.core;

      this.rateLimit = {
        limit: core.limit,
        remaining: core.remaining,
        reset: new Date(core.reset * 1000),
        used: core.used,
      };

      // Log warning if approaching limit
      if (core.remaining < this.warningThreshold) {
        console.warn(
          `[GitHub API] Rate limit warning: ${core.remaining}/${core.limit} remaining. ` +
          `Resets at ${this.rateLimit.reset.toISOString()}`
        );
      }

      return this.rateLimit;
    } catch (error) {
      console.error('[GitHub API] Failed to fetch rate limit:', error);
      throw error;
    }
  }

  /**
   * Check if we're approaching rate limit
   */
  async checkRateLimit(): Promise<boolean> {
    const rateLimit = await this.getRateLimit();
    return rateLimit.remaining > 10; // Keep buffer of 10 requests
  }

  /**
   * Wait until rate limit resets
   */
  async waitForRateLimitReset(): Promise<void> {
    const rateLimit = await this.getRateLimit();
    const now = new Date();
    const waitTime = rateLimit.reset.getTime() - now.getTime();

    if (waitTime > 0) {
      console.log(
        `[GitHub API] Rate limit exceeded. Waiting ${Math.ceil(waitTime / 1000)}s until reset...`
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime + 1000)); // Add 1s buffer
    }
  }

  /**
   * Get cached rate limit info (doesn't make API call)
   */
  getCachedRateLimit(): RateLimitInfo | null {
    return this.rateLimit;
  }
}

/**
 * Retry a GitHub API call with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 5,
    baseDelay = 1000,
    maxDelay = 60000,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      // Don't retry on certain errors
      if (shouldNotRetry(error as { status?: number })) {
        throw error;
      }

      // Check if we should retry
      if (attempt === maxRetries) {
        console.error(`[Retry] Max retries (${maxRetries}) reached`);
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = Math.random() * 0.3 * delay; // Add 0-30% jitter
      const totalDelay = Math.floor(delay + jitter);

      console.log(
        `[Retry] Attempt ${attempt + 1}/${maxRetries} failed. ` +
        `Retrying in ${totalDelay}ms... Error: ${(error as Error).message || String(error)}`
      );

      if (onRetry) {
        onRetry(attempt + 1, error);
      }

      await new Promise((resolve) => setTimeout(resolve, totalDelay));
    }
  }

  throw lastError;
}

/**
 * Determine if error should not be retried
 */
function shouldNotRetry(error: { status?: number }): boolean {
  // Don't retry on authentication errors
  if (error.status === 401 || error.status === 403) {
    return true;
  }

  // Don't retry on not found
  if (error.status === 404) {
    return true;
  }

  // Don't retry on validation errors
  if (error.status === 422) {
    return true;
  }

  // Don't retry on client errors (400-499) except rate limit and 408 (timeout)
  if (error.status && error.status >= 400 && error.status < 500) {
    // Retry on rate limit (429) and timeout (408)
    return error.status !== 429 && error.status !== 408;
  }

  return false;
}

/**
 * Wrapped Octokit with automatic rate limiting and retry
 */
export class RateLimitedOctokit extends Octokit {
  private rateLimiter: GitHubRateLimiter;
  private retryOptions: RetryOptions;

  constructor(auth: string, retryOptions: RetryOptions = {}) {
    super({
      auth,
      retry: {
        enabled: false, // We handle retries ourselves
      },
    });

    this.rateLimiter = new GitHubRateLimiter(this);
    this.retryOptions = {
      maxRetries: 5,
      baseDelay: 1000,
      maxDelay: 60000,
      ...retryOptions,
    };

    // Override request method to add rate limiting
    this.hook.wrap('request', async (request, options) => {
      return retryWithBackoff(
        async () => {
          // Check rate limit before request
          const canProceed = await this.rateLimiter.checkRateLimit();
          if (!canProceed) {
            await this.rateLimiter.waitForRateLimitReset();
          }

          // Make the request
          const response = await request(options);

          // Update rate limit from response headers
          if (response.headers) {
            const remaining = response.headers['x-ratelimit-remaining'];
            const reset = response.headers['x-ratelimit-reset'];
            
            if (remaining && parseInt(remaining as string) < 100) {
              console.warn(
                `[GitHub API] Rate limit warning from response: ` +
                `${remaining} remaining, resets at ${new Date(parseInt(reset as string) * 1000).toISOString()}`
              );
            }
          }

          return response;
        },
        this.retryOptions
      );
    });
  }

  async getRateLimit(): Promise<RateLimitInfo> {
    return this.rateLimiter.getRateLimit();
  }

  getCachedRateLimit(): RateLimitInfo | null {
    return this.rateLimiter.getCachedRateLimit();
  }
}

/**
 * Helper to handle rate limit errors specifically
 */
export async function handleRateLimitError(
  error: { status?: number },
  octokit: RateLimitedOctokit
): Promise<void> {
  if (error.status === 429) {
    console.log('[GitHub API] Rate limit hit (429), waiting for reset...');
    const rateLimit = await octokit.getRateLimit();
    const now = new Date();
    const waitTime = rateLimit.reset.getTime() - now.getTime();

    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime + 1000));
    }
  }
}

/**
 * Batch requests with rate limit awareness
 */
export async function batchWithRateLimit<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  options: {
    batchSize?: number;
    delayBetweenBatches?: number;
    onProgress?: (completed: number, total: number) => void;
  } = {}
): Promise<R[]> {
  const {
    batchSize = 10,
    delayBetweenBatches = 1000,
    onProgress,
  } = options;

  const results: R[] = [];
  const batches = Math.ceil(items.length / batchSize);

  for (let i = 0; i < batches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, items.length);
    const batch = items.slice(start, end);

    console.log(`[Batch] Processing batch ${i + 1}/${batches} (${batch.length} items)`);

    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map((item) =>
        retryWithBackoff(() => fn(item), {
          maxRetries: 3,
          baseDelay: 1000,
        })
      )
    );

    results.push(...batchResults);

    if (onProgress) {
      onProgress(results.length, items.length);
    }

    // Delay between batches to avoid rate limits
    if (i < batches - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return results;
}
