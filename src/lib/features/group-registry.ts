import type { Component } from 'svelte';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GroupComponent = Component<any, any, any>;

// Store component loaders instead of direct components
export type GroupComponentLoader = () => Promise<{ default: GroupComponent }>;

const customGroupRenderers = new Map<string, GroupComponentLoader>();
const loadedComponents = new Map<string, GroupComponent>();

/**
 * Register a group renderer (lazy loader)
 *
 * @param type - Group type (e.g., 'docker-group')
 * @param loader - Component lazy import function
 */
export function registerGroupRenderer(type: string, loader: GroupComponentLoader): void {
  if (customGroupRenderers.has(type)) {
    console.warn(`[group-registry] Group type "${type}" already registered, overwriting`);
  }

  customGroupRenderers.set(type, loader);
}

/**
 * Get group renderer component
 * Lazy loads on first access and caches afterwards
 */
export async function getGroupRenderer(type: string): Promise<GroupComponent | undefined> {
  if (loadedComponents.has(type)) {
    return loadedComponents.get(type);
  }

  const loader = customGroupRenderers.get(type);
  if (!loader) {
    return undefined;
  }

  try {
    const module = await loader();
    const component = module.default;
    loadedComponents.set(type, component);
    return component;
  } catch (error) {
    console.error(`[group-registry] Failed to load component for type "${type}":`, error);
    return undefined;
  }
}

export function hasCustomRenderer(type: string): boolean {
  return customGroupRenderers.has(type);
}

export function getRegisteredTypes(): string[] {
  return Array.from(customGroupRenderers.keys());
}

export function clearRegistry(): void {
  customGroupRenderers.clear();
  loadedComponents.clear();
  console.log('[group-registry] Registry cleared');
}
