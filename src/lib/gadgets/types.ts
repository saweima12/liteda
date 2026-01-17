import type { Component } from 'svelte';
import type { ZodType } from 'zod';

/** Props passed to gadget components */
export interface GadgetProps<TConfig = Record<string, unknown>> {
  config: TConfig;
  /** Unique gadget instance ID (for API calls) */
  id: string;
}

/** Gadget configuration from YAML */
export interface GadgetConfig {
  type: string;
  vars?: unknown;
  [key: string]: unknown;
}

/** Gadget metadata for registry */
export interface GadgetMeta<TConfig = Record<string, unknown>> {
  name: string;
  component: Component<GadgetProps<TConfig>>;
  description?: string;
  icon?: string;
  /** Zod schema for validating config options */
  configSchema?: ZodType<TConfig>;
  /** Zod schema for server-side vars (if gadget needs API calls) */
  varsSchema?: ZodType;
}
