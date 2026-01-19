import type { FeatureRegistryEntry } from './types';

export const FEATURES_REGISTRY_SERVER: Record<string, FeatureRegistryEntry> = {
  'docker-discovery': {
    meta: () => import('./docker-discovery/meta.server').then((module) => ({ meta: module.meta })),
    feature: () => import('./docker-discovery'),
  },
  'example-feature': {
    meta: () => import('./example-feature/meta').then((module) => ({ meta: module.meta })),
    feature: () => import('./example-feature'),
  },
};

export function getRegisteredFeatures(): string[] {
  return Object.keys(FEATURES_REGISTRY_SERVER);
}

export function isFeatureRegistered(name: string): boolean {
  return name in FEATURES_REGISTRY_SERVER;
}
