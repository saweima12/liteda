import { browser } from '$app/environment';

export interface FetchWidgetOptions {
  signal?: AbortSignal;
}

export class WidgetFetchError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'WidgetFetchError';
  }
}

/**
 * Fetch widget data from the API
 * @param type - Widget type (matches folder name in widgets/)
 * @param body - Optional request body
 * @param options - Optional fetch options (signal for abort)
 */
export async function fetchWidget<T>(
  type: string,
  body?: unknown,
  options?: FetchWidgetOptions
): Promise<T> {
  if (!browser) {
    throw new WidgetFetchError('fetchWidget can only be called in browser');
  }

  const res = await fetch(`/api/widgets/${type}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: options?.signal,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new WidgetFetchError(error.message || `HTTP ${res.status}`, res.status);
  }

  return res.json();
}

/**
 * Create an AbortController helper for widget fetching
 * Returns a function that creates a new signal and aborts the previous one
 */
export function createAbortController() {
  let controller: AbortController | null = null;

  return {
    /** Get a new signal, aborting any previous request */
    getSignal(): AbortSignal {
      controller?.abort();
      controller = new AbortController();
      return controller.signal;
    },
    /** Abort the current request */
    abort(): void {
      controller?.abort();
      controller = null;
    },
  };
}
