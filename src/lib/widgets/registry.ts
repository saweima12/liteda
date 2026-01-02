import type { Component } from 'svelte';
import type { WidgetProps, WidgetMeta } from './types';

// Auto-scan all widget meta files (exclude _template)
const metaModules = import.meta.glob<{ default: WidgetMeta }>(
  ['./*/meta.ts', '!./_template/meta.ts'],
  { eager: true }
);

// Build registry from scanned modules
const widgetRegistry = new Map<string, WidgetMeta>();

for (const [_, module] of Object.entries(metaModules)) {
  const meta = module.default;
  if (meta?.name && 'component' in meta) {
    widgetRegistry.set(meta.name, meta);
  }
}

export function getWidgetComponent(type: string): Component<WidgetProps> | undefined {
  return widgetRegistry.get(type)?.component;
}

export function getWidgetMeta(type: string): WidgetMeta | undefined {
  return widgetRegistry.get(type);
}

export function hasWidget(type: string): boolean {
  return widgetRegistry.has(type);
}

export function getAllWidgets(): WidgetMeta[] {
  return Array.from(widgetRegistry.values());
}
