/**
 * LRU Cache Implementation
 * Simple in-memory caching with TTL support
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize = 500, defaultTTL = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  set(key: string, value: T, ttl?: number): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttl || this.defaultTTL),
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

// Create cache instances for different data types
export const workspaceCache = new LRUCache<unknown>(200, 10 * 60 * 1000); // 10 minutes
export const documentCache = new LRUCache<unknown>(500, 5 * 60 * 1000); // 5 minutes
export const userCache = new LRUCache<unknown>(100, 30 * 60 * 1000); // 30 minutes

/**
 * Generic cached fetcher
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  cache: LRUCache<T> = documentCache as LRUCache<T>,
  ttl?: number
): Promise<T> {
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const data = await fetcher();
  cache.set(key, data, ttl);
  return data;
}

/**
 * Invalidate cache by pattern
 */
export function invalidateCachePattern(pattern: string, cache: LRUCache<unknown>): void {
  // This is a simplified implementation
  // In production, consider using a more sophisticated cache like Redis
  cache.clear();
}
