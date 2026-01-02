import type { Component } from 'svelte';
import type { ZodType } from 'zod';
import type { WidgetMeta, WidgetProps } from '../types';

export interface DefineWidgetConfig<TData, TVars> {
  /** Unique widget identifier */
  name: string;
  /** Svelte component for rendering */
  component: Component<WidgetProps>;
  /** Zod schema for widget response data */
  dataSchema: ZodType<TData>;
  /** Zod schema for server-side vars (optional) */
  varsSchema?: ZodType<TVars>;
  /** Widget description */
  description?: string;
  /** Lucide icon name */
  icon?: string;
}

export interface DefinedWidget<TData, TVars> extends WidgetMeta {
  /** Zod schema for widget response data */
  dataSchema: ZodType<TData>;
  /** Zod schema for server-side vars */
  varsSchema?: ZodType<TVars>;
}

/**
 * Define a widget with full type safety
 * 
 * @example
 * ```typescript
 * // widgets/my-widget/meta.ts
 * import { defineWidget } from '../utils/define';
 * import Widget from './Widget.svelte';
 * 
 * const widget = defineWidget({
 *   name: 'my-widget',
 *   component: Widget,
 *   dataSchema: z.object({
 *     status: z.enum(['online', 'offline']),
 *     uptime: z.string(),
 *   }),
 *   varsSchema: z.object({
 *     apiKey: z.string(),
 *   }),
 * });
 * 
 * export default widget;
 * ```
 * 
 * ```svelte
 * // widgets/my-widget/Widget.svelte
 * <script lang="ts">
 *   import widget from './meta';
 *   import { useWidget } from '../utils';
 *   
 *   let { config }: Props = $props();
 *   const { data, loading, error } = useWidget(widget, () => config);
 * </script>
 * ```
 */
export function defineWidget<TData, TVars = unknown>(
  config: DefineWidgetConfig<TData, TVars>
): DefinedWidget<TData, TVars> {
  const { name, component, dataSchema, varsSchema, description, icon } = config;

  return {
    name,
    component,
    description,
    icon,
    dataSchema,
    varsSchema,
  };
}
