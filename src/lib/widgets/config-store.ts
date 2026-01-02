import type { WidgetConfig } from './types';

/**
 * Server-side widget configuration store
 * Maps widget instance ID to full config (including vars)
 * 
 * This is populated during page load and used by widget handlers
 * to access sensitive configuration without exposing it to the client
 */
const widgetConfigs = new Map<string, WidgetConfig>();

export function registerWidgetConfig(id: string, config: WidgetConfig): void {
  widgetConfigs.set(id, config);
}

export function getWidgetConfig(id: string): WidgetConfig | undefined {
  return widgetConfigs.get(id);
}

export function clearWidgetConfigs(): void {
  widgetConfigs.clear();
}

export function getAllWidgetConfigs(): Map<string, WidgetConfig> {
  return new Map(widgetConfigs);
}
