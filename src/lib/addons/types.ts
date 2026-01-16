import type { Component } from 'svelte';
import type { ZodType } from 'zod';

/** Props passed to addon components */
export interface AddonProps<TConfig = Record<string, unknown>> {
  config: TConfig;
  /** Unique addon instance ID (for API calls) */
  id: string;
}

/** Addon configuration from YAML */
export interface AddonConfig {
  type: string;
  [key: string]: unknown;
}

/** Addon metadata for registry */
export interface AddonMeta<TConfig = Record<string, unknown>> {
  name: string;
  component: Component<AddonProps<TConfig>>;
  description?: string;
  icon?: string;
  /** Zod schema for validating config options */
  configSchema?: ZodType<TConfig>;
  /** Zod schema for server-side vars (if addon needs API calls) */
  varsSchema?: ZodType;
}
