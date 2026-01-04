import type { Component } from 'svelte';
import type { ZodType } from 'zod';

/** Service status from widget or status check */
export type ServiceStatus = 'online' | 'offline' | 'unknown';

export interface WidgetProps {
  config: ClientWidgetConfig;
  onStatus?: (event: CustomEvent<{ status: ServiceStatus; latency: number | null }>) => void;
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

/** Widget response format */
export interface WidgetResponse<T = unknown> {
  data: T;
  status: ServiceStatus;
  latency?: number; // Response time in ms
  checkedAt: number; // Timestamp
}
