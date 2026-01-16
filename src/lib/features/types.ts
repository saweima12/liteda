import type { PageContent } from '$lib/config/schema';

/**
 * Feature interface - all features must implement this
 *
 * Features are heavy optional functionality that can be enabled via config.
 * Unlike gadgets/widgets which are always bundled, features are lazy-loaded
 * only when enabled.
 */
export interface Feature {
  /** Feature name (matches config key) */
  name: string;

  /** Feature version */
  version: string;

  /**
   * Initialize the feature
   * Called at server startup if feature is enabled
   *
   * @param vars - Feature configuration vars from settings.yaml
   * @param pagesContent - Map of page content (can be modified to inject services)
   */
  init(vars: unknown, pagesContent: Map<string, PageContent>): Promise<void>;

  /**
   * Optional cleanup on server shutdown
   */
  destroy?(): Promise<void>;
}

/**
 * Feature configuration from settings.yaml
 */
export interface FeatureConfig {
  enabled: boolean;
  vars?: Record<string, unknown>;
}
