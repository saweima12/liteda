import type { FeatureMeta } from './types';
import { hasCustomRenderer, registerGroupRenderer, type GroupComponentLoader } from './group-registry';

type FeatureRegistryEntryClient = {
  meta: () => Promise<{ meta: FeatureMeta }>;
};

export const FEATURES_REGISTRY_CLIENT: Record<string, FeatureRegistryEntryClient> = {
  'docker-discovery': {
    meta: () => import('./docker-discovery/meta.client').then((module) => ({ meta: module.meta })),
  },
  'example-feature': {
    meta: () => import('./example-feature/meta').then((module) => ({ meta: module.meta })),
  },
};

export async function ensureFeatureGroupsRegistered(): Promise<void> {
  const entries = Object.values(FEATURES_REGISTRY_CLIENT);
  for (const entry of entries) {
    try {
      const metaModule = await entry.meta();
      const meta = metaModule.meta;
      if (!meta.groups) {
        continue;
      }

      for (const [groupType, componentLoader] of Object.entries(meta.groups)) {
        if (hasCustomRenderer(groupType)) {
          continue;
        }
        registerGroupRenderer(groupType, componentLoader as GroupComponentLoader);
      }
    } catch (error) {
      console.warn('[Features] Failed to preload feature groups (client):', error);
    }
  }
}
