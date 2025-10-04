/**
 * Simple in-memory cache with TTL (Time To Live) support
 * Ideal for caching API responses to reduce external API calls
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTtl: number;

  constructor(defaultTtlMinutes: number = 30) {
    this.defaultTtl = defaultTtlMinutes * 60 * 1000; // Convert to milliseconds
  }

  /**
   * Get an item from cache if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set an item in cache with optional custom TTL
   */
  set<T>(key: string, data: T, ttlMinutes?: number): void {
    const ttl = ttlMinutes ? ttlMinutes * 60 * 1000 : this.defaultTtl;
    const expiresAt = Date.now() + ttl;

    this.cache.set(key, {
      data,
      expiresAt,
    });
  }

  /**
   * Delete an item from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries from cache
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache stats for debugging
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Get or set pattern - fetches from cache or executes function and caches result
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMinutes?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // If not in cache, fetch and cache the result
    try {
      const data = await fetchFn();
      this.set(key, data, ttlMinutes);
      return data;
    } catch (error) {
      // Don't cache errors, just throw
      throw error;
    }
  }
}

// Create a singleton cache instance with 30-minute default TTL
export const cache = new MemoryCache(30);

/**
 * Generate a cache key based on multiple values
 */
export function generateCacheKey(...parts: (string | number | boolean)[]): string {
  return parts.map(part => String(part)).join(':');
}

/**
 * Hash a string to create a shorter, consistent cache key
 * Useful for long keys like URLs or tokens
 */
export function hashCacheKey(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}