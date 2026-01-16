import type { Component } from 'svelte';
import type { GadgetMeta, GadgetProps } from './types';

// Auto-scan all gadget meta files (exclude _template)
const metaModules = import.meta.glob<{ default: GadgetMeta }>(
  ['./*/meta.ts', '!./_template/meta.ts'],
  { eager: true }
);

// Build registry from scanned modules
const gadgetRegistry = new Map<string, GadgetMeta>();

for (const [_, module] of Object.entries(metaModules)) {
  const meta = module.default;
  if (meta?.name && 'component' in meta) {
    gadgetRegistry.set(meta.name, meta);
  }
}

export function getGadgetComponent(type: string): Component<GadgetProps> | undefined {
  return gadgetRegistry.get(type)?.component as Component<GadgetProps> | undefined;
}

export function getGadgetMeta(type: string): GadgetMeta | undefined {
  return gadgetRegistry.get(type);
}

export function hasGadget(type: string): boolean {
  return gadgetRegistry.has(type);
}

export function getAllGadgets(): GadgetMeta[] {
  return Array.from(gadgetRegistry.values());
}
