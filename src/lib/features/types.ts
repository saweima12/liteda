import type { Component } from 'svelte';
import type { RequestHandler } from '@sveltejs/kit';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FeatureGroupComponent = Component<any, any, any>;
import type { z } from 'zod';

/**
 * Feature metadata - declared in meta.ts
 * Meta itself is lazy-loaded when the feature is enabled
 */
export interface FeatureMeta {
  /** Feature name */
  name: string;

  /** Feature version */
  version: string;

  /** Feature description */
  description: string;

  /** Config schema */
  varsSchema: z.ZodSchema;

  /**
   * Group component registration (lazy loader)
   * Key: group type (e.g., 'docker-group')
   */
  groups?: Record<string, () => Promise<{ default: FeatureGroupComponent }>>;

  /**
   * API handlers (lazy loader)
   * Key: handler type (e.g., 'docker-group')
   */
  handlers?: Record<
    string,
    () => Promise<{ GET?: RequestHandler; POST?: RequestHandler }>
  >;
}

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
   */
  init(vars: unknown): Promise<void>;

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

/**
 * Feature registry entry
 */
export interface FeatureRegistryEntry {
  meta: () => Promise<{ meta: FeatureMeta }>;
  feature: () => Promise<{ default: Feature }>;
}
