import type { WidgetConfig } from './types';

/**
 * Server-side widget configuration store
 * Maps widget instance ID to full config (including vars)
 * 
 * This is populated during page load and used by widget handlers
 * to access sensitive configuration without exposing it to the client
 */
let widgetConfigs = new Map<string, WidgetConfig>();

export function updateWidgetConfigs(newConfigs: Map<string, WidgetConfig>) {
  widgetConfigs = newConfigs;
}

export function getWidgetConfig(id: string): WidgetConfig | undefined {
  return widgetConfigs.get(id);
}

export function getAllWidgetConfigs(): Map<string, WidgetConfig> {
  return new Map(widgetConfigs);
}
