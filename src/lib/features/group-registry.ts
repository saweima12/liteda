import type { ComponentType } from 'svelte';

type GroupComponent = ComponentType;

const customGroupRenderers = new Map<string, GroupComponent>();

export function registerGroupRenderer(type: string, component: GroupComponent): void {
  if (customGroupRenderers.has(type)) {
    console.warn(`[group-registry] Group type "${type}" already registered, overwriting`);
  }

  customGroupRenderers.set(type, component);
  console.log(`[group-registry] Registered: ${type}`);
}

export function getGroupRenderer(type: string): GroupComponent | undefined {
  return customGroupRenderers.get(type);
}

export function hasCustomRenderer(type: string): boolean {
  return customGroupRenderers.has(type);
}

export function getRegisteredTypes(): string[] {
  return Array.from(customGroupRenderers.keys());
}

export function clearRegistry(): void {
  customGroupRenderers.clear();
  console.log('[group-registry] Registry cleared');
}
