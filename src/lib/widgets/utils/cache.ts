/**
 * Server-side widget data cache
 * Prevents duplicate requests when multiple clients poll the same widget
 */

interface CacheEntry<T = unknown> {
  data: T;
  expiry: number;
  /** Pending promise to prevent thundering herd */
  pending?: Promise<T>;
}

const cache = new Map<string, CacheEntry>();

/** Default cache TTL: 5 seconds */
const DEFAULT_TTL_MS = 5000;

/**
 * Get cached widget data or fetch fresh data
 * 
 * Features:
 * - TTL-based expiration
 * - Thundering herd prevention (concurrent requests share the same promise)
 * - Automatic cleanup on error
 * 
 * @param key - Unique cache key (typically widget ID)
 * @param fetcher - Function to fetch fresh data
 * @param ttlMs - Time to live in milliseconds (default: 5000)
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<T> {
  const now = Date.now();
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  // Return cached data if still valid
  if (entry && now < entry.expiry && entry.data !== undefined) {
    return entry.data;
  }

  // If there's already a pending request, wait for it
  if (entry?.pending) {
    return entry.pending;
  }

  // Create new fetch promise
  const pending = fetcher();
  
  // Store pending promise to prevent concurrent fetches
  cache.set(key, { 
    data: entry?.data as T, // Keep stale data while fetching
    expiry: entry?.expiry ?? 0,
    pending 
  });

  try {
    const data = await pending;
    cache.set(key, { 
      data, 
      expiry: now + ttlMs,
      pending: undefined 
    });
    return data;
  } catch (error) {
    // On error, remove pending but keep stale data if exists
    if (entry?.data !== undefined) {
      cache.set(key, { 
        data: entry.data, 
        expiry: entry.expiry,
        pending: undefined 
      });
    } else {
      cache.delete(key);
    }
    throw error;
  }
}

/**
 * Invalidate a specific cache entry
 */
export function invalidateCache(key: string): void {
  cache.delete(key);
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
