import type { Component } from 'svelte';
import type { AddonMeta, AddonProps } from './types';

// Auto-scan all addon meta files (exclude _template)
const metaModules = import.meta.glob<{ default: AddonMeta }>(
  ['./*/meta.ts', '!./_template/meta.ts'],
  { eager: true }
);

// Build registry from scanned modules
const addonRegistry = new Map<string, AddonMeta>();

for (const [_, module] of Object.entries(metaModules)) {
  const meta = module.default;
  if (meta?.name && 'component' in meta) {
    addonRegistry.set(meta.name, meta);
  }
}

export function getAddonComponent(type: string): Component<AddonProps> | undefined {
  return addonRegistry.get(type)?.component as Component<AddonProps> | undefined;
}

export function getAddonMeta(type: string): AddonMeta | undefined {
  return addonRegistry.get(type);
}

export function hasAddon(type: string): boolean {
  return addonRegistry.has(type);
}

export function getAllAddons(): AddonMeta[] {
  return Array.from(addonRegistry.values());
}
