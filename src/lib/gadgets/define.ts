import type { Component } from 'svelte';
import type { ZodType } from 'zod';
import type { GadgetMeta, GadgetProps } from './types';

export interface DefineGadgetConfig<TConfig> {
  /** Unique gadget identifier */
  name: string;
  /** Svelte component for rendering */
  component: Component<GadgetProps<TConfig>>;
  /** Gadget description */
  description?: string;
  /** Lucide icon name */
  icon?: string;
  /** Zod schema for config options (optional) */
  configSchema?: ZodType<TConfig>;
  /** Zod schema for server-side vars (optional, for gadgets that need API calls) */
  varsSchema?: ZodType;
}

/**
 * Define an gadget with type safety
 * 
 * @example
 * ```typescript
 * // gadgets/search/meta.ts
 * import { z } from 'zod';
 * import { defineGadget } from '../define';
 * import Gadget from './Gadget.svelte';
 * 
 * export default defineGadget({
 *   name: 'search',
 *   component: Gadget,
 *   description: 'Search bar',
 *   configSchema: z.object({
 *     placeholder: z.string().optional(),
 *   }),
 * });
 * ```
 */
export function defineGadget<TConfig = Record<string, never>>(
  config: DefineGadgetConfig<TConfig>
): GadgetMeta<TConfig> {
  return {
    name: config.name,
    component: config.component,
    description: config.description,
    icon: config.icon,
    configSchema: config.configSchema,
    varsSchema: config.varsSchema,
  };
}
