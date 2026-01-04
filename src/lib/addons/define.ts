import type { Component } from 'svelte';
import type { ZodType } from 'zod';
import type { AddonMeta, AddonProps } from './types';

export interface DefineAddonConfig<TConfig> {
  /** Unique addon identifier */
  name: string;
  /** Svelte component for rendering */
  component: Component<AddonProps<TConfig>>;
  /** Addon description */
  description?: string;
  /** Lucide icon name */
  icon?: string;
  /** Zod schema for config options (optional) */
  configSchema?: ZodType<TConfig>;
  /** Zod schema for server-side vars (optional, for addons that need API calls) */
  varsSchema?: ZodType;
}

/**
 * Define an addon with type safety
 * 
 * @example
 * ```typescript
 * // addons/search/meta.ts
 * import { z } from 'zod';
 * import { defineAddon } from '../define';
 * import Addon from './Addon.svelte';
 * 
 * export default defineAddon({
 *   name: 'search',
 *   component: Addon,
 *   description: 'Search bar',
 *   configSchema: z.object({
 *     placeholder: z.string().optional(),
 *   }),
 * });
 * ```
 */
export function defineAddon<TConfig = Record<string, never>>(
  config: DefineAddonConfig<TConfig>
): AddonMeta<TConfig> {
  return {
    name: config.name,
    component: config.component,
    description: config.description,
    icon: config.icon,
    configSchema: config.configSchema,
    varsSchema: config.varsSchema,
  };
}
