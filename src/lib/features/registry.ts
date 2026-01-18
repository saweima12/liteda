import type { FeatureMeta, FeatureRegistryEntry } from './types';
import { hasCustomRenderer, registerGroupRenderer, type GroupComponentLoader } from './group-registry';

/**
 * Feature registry - manually register all available features
 *
 * Why manual registration?
 * - Features are heavy (1-5 MB) and should not be bundled unintentionally
 * - Manual registry provides explicit feature list
 * - Keeps fully lazy loading; only enabled features are loaded
 */
export const FEATURES_REGISTRY: Record<string, FeatureRegistryEntry> = {
  'docker-discovery': {
    meta: () => import('./docker-discovery/meta').then((module) => ({ meta: module.meta })),
    feature: () => import('./docker-discovery'),
  },
  'example-feature': {
    meta: () => import('./example-feature/meta').then((module) => ({ meta: module.meta })),
    feature: () => import('./example-feature'),
  },
  // 'kubernetes': {
  //   meta: () => import('./kubernetes/meta'),
  //   feature: () => import('./kubernetes'),
  // },
};

export function getRegisteredFeatures(): string[] {
  return Object.keys(FEATURES_REGISTRY);
}

export function isFeatureRegistered(name: string): boolean {
  return name in FEATURES_REGISTRY;
}

export async function ensureFeatureGroupsRegistered(): Promise<void> {
  const entries = Object.values(FEATURES_REGISTRY);
  for (const entry of entries) {
    try {
      const metaModule = await entry.meta();
      const meta = metaModule.meta;
      registerFeatureGroups(meta);
    } catch (error) {
      console.warn('[Features] Failed to preload feature groups:', error);
    }
  }
}

function registerFeatureGroups(meta: FeatureMeta): void {
  if (!meta.groups) {
    return;
  }

  for (const [groupType, componentLoader] of Object.entries(meta.groups)) {
    if (hasCustomRenderer(groupType)) {
      continue;
    }

    registerGroupRenderer(groupType, componentLoader as GroupComponentLoader);
  }
}
