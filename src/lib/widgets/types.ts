import type { Component } from 'svelte';
import type { ZodType } from 'zod';

export interface WidgetProps {
  config: ClientWidgetConfig;
}

/** Client-side widget config (safe to expose) */
export interface ClientWidgetConfig {
  type: string;
  interval?: number;
  /** Unique widget instance ID for server lookup */
  id: string;
}

/** Full widget config including server-side vars */
export interface WidgetConfig {
  type: string;
  interval?: number;
  /** Server-side only variables - NEVER sent to client */
  vars?: Record<string, unknown>;
}

export interface WidgetMeta {
  name: string;
  component: Component<WidgetProps>;
  description?: string;
  icon?: string;
  /** Zod schema for validating vars */
  varsSchema?: ZodType;
}
