import { browser } from '$app/environment';

/**
 * Reactive cached entry (each field is $state)
 */
class CachedEntry<T = unknown> {
  key: string;
  data = $state<T | null>(null);
  error = $state<string | null>(null);
  loading = $state(true);
  expiresAt = $state(0); // timestamp (ms)
  ttl: number;
  fetcher: () => Promise<T>;
  subscribers = $state(0);

  constructor(key: string, ttl: number, fetcher: () => Promise<T>) {
    this.key = key;
    this.ttl = ttl;
    this.fetcher = fetcher;
  }
}

/**
 * Data pool for unified polling and caching
 *
 * Features:
 * - Single setInterval for all data sources
 * - TTL-based expiration
 * - Automatic cleanup when no subscribers
 * - Prevents duplicate requests
 */
class DataPool {
  private cache = new Map<string, CachedEntry>();
  private schedulerId: ReturnType<typeof setInterval> | null = null;
  private activeRequests = new Set<string>();
  private readonly SCHEDULER_INTERVAL = 1000; // Check every 1s
  private readonly MAX_CONCURRENT_REQUESTS = 10; // Max concurrent HTTP requests

  constructor() {
    if (browser) {
      this.startScheduler();
    }
  }

  /**
   * Subscribe to a data source
   * Returns a reactive object that updates when data changes
   *
   * @param key - Unique identifier (e.g., 'widget:portainer:xxx')
   * @param ttl - Time to live in milliseconds
   * @param fetcher - Function to fetch data
   */
  subscribe<T>(
    key: string,
    ttl: number,
    fetcher: () => Promise<T>
  ): DataPoolSubscription<T> {
    let entry = this.cache.get(key) as CachedEntry<T> | undefined;

    if (!entry) {
      // Create new reactive entry
      entry = new CachedEntry<T>(key, ttl, fetcher);
      this.cache.set(key, entry);
    }

    // Increment subscriber count
    entry.subscribers++;

    // Return reactive subscription (entry fields are $state, so getters work)
    return {
      get data() {
        return entry!.data as T | null;
      },
      get error() {
        return entry!.error;
      },
      get loading() {
        return entry!.loading;
      },
      refresh: () => this.fetchEntry(key),
    };
  }

  /**
   * Unsubscribe from a data source
   * Automatically cleans up when no subscribers remain
   */
  unsubscribe(key: string): void {
    const entry = this.cache.get(key);
    if (!entry) return;

    entry.subscribers--;

    // Cleanup if no more subscribers
    if (entry.subscribers <= 0) {
      this.cache.delete(key);
    }
  }

  /**
   * Start the unified scheduler
   * Checks for expired entries every second
   */
  private startScheduler(): void {
    this.schedulerId = setInterval(() => {
      const now = Date.now();
      const expiredKeys: string[] = [];

      // Find all expired entries
      for (const [key, entry] of this.cache.entries()) {
        if (now >= entry.expiresAt && !this.activeRequests.has(key)) {
          expiredKeys.push(key);
        }
      }

      // Fetch expired entries with concurrency control
      if (expiredKeys.length > 0) {
        this.batchFetch(expiredKeys);
      }
    }, this.SCHEDULER_INTERVAL);
  }

  /**
   * Fetch multiple entries with concurrency control
   * Splits requests into batches to avoid overwhelming server/browser
   */
  private async batchFetch(keys: string[]): Promise<void> {
    // Process in batches of MAX_CONCURRENT_REQUESTS
    for (let i = 0; i < keys.length; i += this.MAX_CONCURRENT_REQUESTS) {
      const batch = keys.slice(i, i + this.MAX_CONCURRENT_REQUESTS);

      // Execute batch in parallel, wait for completion before next batch
      await Promise.allSettled(batch.map((key) => this.fetchEntry(key)));
    }
  }

  /**
   * Fetch a single entry
   */
  private async fetchEntry(key: string): Promise<void> {
    const entry = this.cache.get(key);
    if (!entry) return;

    // Prevent duplicate requests
    if (this.activeRequests.has(key)) {
      return;
    }

    this.activeRequests.add(key);
    entry.loading = true;

    try {
      const data = await entry.fetcher();
      entry.data = data;
      entry.error = null;
      entry.expiresAt = Date.now() + entry.ttl;
    } catch (e) {
      entry.error = e instanceof Error ? e.message : 'Unknown error';
      entry.expiresAt = Date.now() + entry.ttl; // Retry after TTL
    } finally {
      entry.loading = false;
      this.activeRequests.delete(key);
    }
  }

  /**
   * Get pool statistics (for debugging)
   */
  getStats() {
    return {
      totalEntries: this.cache.size,
      activeRequests: this.activeRequests.size,
      maxConcurrency: this.MAX_CONCURRENT_REQUESTS,
      schedulerInterval: this.SCHEDULER_INTERVAL,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        subscribers: entry.subscribers,
        loading: entry.loading,
        hasError: entry.error !== null,
        hasData: entry.data !== null,
        expiresIn: Math.max(0, entry.expiresAt - Date.now()),
      })),
    };
  }

  /**
   * Cleanup (called on app unmount)
   */
  destroy(): void {
    if (this.schedulerId) {
      clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
    this.cache.clear();
    this.activeRequests.clear();
  }
}

/**
 * Subscription object returned by data pool
 */
export interface DataPoolSubscription<T> {
  readonly data: T | null;
  readonly error: string | null;
  readonly loading: boolean;
  refresh: () => Promise<void>;
}

// Export singleton instance
export const dataPool = new DataPool();
