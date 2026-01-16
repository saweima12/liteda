/**
 * Server-side widget data cache
 * Prevents duplicate requests when multiple clients poll the same widget
 *
 * Features:
 * - LRU eviction when max size is reached (1000 entries)
 * - Lazy expiration (cleanup on access)
 * - Opportunistic cleanup of expired entries (5 per access)
 * - Periodic purge of all expired entries (every 5 minutes)
 * - Thundering herd prevention via shared promises
 *
 * Memory Safety:
 * - Bounded cache size prevents unbounded memory growth
 * - Multiple cleanup strategies ensure expired data is removed
 * - LRU eviction kicks in when max size is reached
 *
 * Usage:
 * ```typescript
 * import { cachedFetch } from '$lib/widgets/utils/cache';
 *
 * const data = await cachedFetch(
 *   'my-cache-key',
 *   async () => {
 *     const res = await fetch('https://api.example.com/data');
 *     return res.json();
 *   },
 *   60000 // TTL in milliseconds (default: 5000)
 * );
 * ```
 */

interface CacheEntry<T = unknown> {
  data: T;
  expiry: number;
  /** Pending promise to prevent thundering herd */
  pending?: Promise<T>;
  /** Last access timestamp for LRU tracking */
  lastAccess: number;
}

const cache = new Map<string, CacheEntry>();

/** Default cache TTL: 5 seconds */
const DEFAULT_TTL_MS = 5000;

/** Maximum cache entries to prevent unbounded memory growth */
const MAX_CACHE_SIZE = 1000;

/** Periodic purge interval: 5 minutes */
const PURGE_INTERVAL_MS = 5 * 60 * 1000;

/** Number of expired entries to opportunistically clean on each access */
const OPPORTUNISTIC_CLEANUP_COUNT = 5;

/**
 * Opportunistically clean up a few expired entries
 * Called on each cache access to gradually remove stale data
 */
function opportunisticCleanup(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of cache.entries()) {
    if (now >= entry.expiry && !entry.pending) {
      cache.delete(key);
      cleaned++;
      if (cleaned >= OPPORTUNISTIC_CLEANUP_COUNT) break;
    }
  }
}

/**
 * Evict least recently used entry to make space
 */
function evictLRU(): void {
  let oldestKey: string | null = null;
  let oldestTime = Infinity;

  for (const [key, entry] of cache.entries()) {
    // Skip entries with pending requests
    if (entry.pending) continue;

    if (entry.lastAccess < oldestTime) {
      oldestTime = entry.lastAccess;
      oldestKey = key;
    }
  }

  if (oldestKey) {
    cache.delete(oldestKey);
  }
}

/**
 * Ensure cache size doesn't exceed MAX_CACHE_SIZE
 * Evicts LRU entries if needed
 */
function enforceMaxSize(): void {
  while (cache.size >= MAX_CACHE_SIZE) {
    evictLRU();
  }
}

/**
 * Get cached widget data or fetch fresh data
 *
 * Features:
 * - TTL-based expiration with lazy cleanup
 * - Thundering herd prevention (concurrent requests share the same promise)
 * - LRU eviction when cache is full
 * - Opportunistic cleanup of expired entries
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

  // Lazy expiration: delete if expired
  if (entry && now >= entry.expiry && !entry.pending) {
    cache.delete(key);
    // Continue to fetch fresh data below
  }

  // Return cached data if still valid
  if (entry && now < entry.expiry && entry.data !== undefined) {
    // Update last access time for LRU tracking
    entry.lastAccess = now;
    cache.set(key, entry); // Move to end of Map (insertion order)

    // Opportunistic cleanup
    opportunisticCleanup();

    return entry.data;
  }

  // If there's already a pending request, wait for it
  if (entry?.pending) {
    return entry.pending;
  }

  // Ensure we have space before adding new entry
  enforceMaxSize();

  // Create new fetch promise
  const pending = fetcher();

  // Store pending promise to prevent concurrent fetches
  cache.set(key, {
    data: entry?.data as T, // Keep stale data while fetching
    expiry: entry?.expiry ?? 0,
    lastAccess: now,
    pending
  });

  try {
    const data = await pending;
    cache.set(key, {
      data,
      expiry: now + ttlMs,
      lastAccess: now,
      pending: undefined
    });
    return data;
  } catch (error) {
    // On error, remove pending but keep stale data if exists
    if (entry?.data !== undefined) {
      cache.set(key, {
        data: entry.data,
        expiry: entry.expiry,
        lastAccess: now,
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
 * Purge all expired entries from cache
 * Called periodically in background or manually
 */
export function purgeExpired(): number {
  const now = Date.now();
  let purged = 0;

  for (const [key, entry] of cache.entries()) {
    if (now >= entry.expiry && !entry.pending) {
      cache.delete(key);
      purged++;
    }
  }

  return purged;
}

/**
 * Get cache statistics (for debugging and monitoring)
 */
export function getCacheStats(): {
  size: number;
  maxSize: number;
  keys: string[];
  expiredCount: number;
} {
  const now = Date.now();
  let expiredCount = 0;

  for (const entry of cache.values()) {
    if (now >= entry.expiry && !entry.pending) {
      expiredCount++;
    }
  }

  return {
    size: cache.size,
    maxSize: MAX_CACHE_SIZE,
    keys: Array.from(cache.keys()),
    expiredCount,
  };
}

// Periodic purge task
let purgeTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Start periodic purge of expired entries
 * Automatically called on first cache access
 */
export function startPeriodicPurge(): void {
  if (purgeTimer !== null) return; // Already started

  purgeTimer = setInterval(() => {
    const purged = purgeExpired();
    if (purged > 0) {
      console.debug(`[Cache] Periodic purge removed ${purged} expired entries`);
    }
  }, PURGE_INTERVAL_MS);

  // Don't keep the process alive just for cache cleanup
  if (purgeTimer.unref) {
    purgeTimer.unref();
  }
}

/**
 * Stop periodic purge task
 * Useful for testing or graceful shutdown
 */
export function stopPeriodicPurge(): void {
  if (purgeTimer !== null) {
    clearInterval(purgeTimer);
    purgeTimer = null;
  }
}

// Auto-start periodic purge on module load
startPeriodicPurge();
