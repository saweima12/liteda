import type { RequestHandler } from '@sveltejs/kit';
import type { Feature, FeatureConfig, FeatureMeta } from './types';
import { FEATURES_REGISTRY } from './registry';
import { registerGroupRenderer, type GroupComponentLoader } from './group-registry';

/** Loaded features (for destroy) */
let loadedFeatures: Feature[] = [];

/** Loaded feature metas */
const loadedMetas = new Map<string, FeatureMeta>();

type HandlerLoader = () => Promise<{ GET?: RequestHandler; POST?: RequestHandler }>;

/** Handler loaders registered from metas */
const handlerLoaders = new Map<string, HandlerLoader>();

/** Loaded handler modules */
const loadedHandlers = new Map<string, { GET?: RequestHandler; POST?: RequestHandler }>();

/**
 * Load and initialize enabled features
 *
 * New loading flow:
 * 1. Lazy import feature meta
 * 2. Register group components from meta (loader only)
 * 3. Register handler loaders from meta
 * 4. Lazy import feature implementation
 * 5. Call feature.init() for heavy dependencies
 *
 * @param featuresConfig - Features section from settings.yaml
 */
export async function loadFeatures(
  featuresConfig: Record<string, FeatureConfig>
): Promise<void> {
  const enabledFeatures = Object.entries(featuresConfig).filter(
    ([_, config]) => config.enabled !== false
  );

  loadedFeatures = [];
  loadedMetas.clear();
  handlerLoaders.clear();
  loadedHandlers.clear();

  if (enabledFeatures.length === 0) {
    console.log('[Features] No features enabled');
    return;
  }

  console.log(`[Features] Loading ${enabledFeatures.length} feature(s)...`);

  for (const [featureName, config] of enabledFeatures) {
    const registryEntry = FEATURES_REGISTRY[featureName];

    if (!registryEntry) {
      console.warn(`[Features] Unknown feature: ${featureName}`);
      continue;
    }

    try {
      console.log(`[Features] Loading feature: ${featureName}`);

      // Step 1: Lazy import meta
      const metaModule = await registryEntry.meta();
      const meta = metaModule.meta;
      loadedMetas.set(featureName, meta);

      // Step 2: Register group components (lazy loaders)
      if (meta.groups) {
        for (const [groupType, componentLoader] of Object.entries(meta.groups)) {
          registerGroupRenderer(groupType, componentLoader as GroupComponentLoader);
          console.log(`[Features]   - Registered group type: ${groupType}`);
        }
      }

      // Step 3: Register handler loaders
      if (meta.handlers) {
        for (const [handlerType, handlerLoader] of Object.entries(meta.handlers)) {
          if (handlerLoaders.has(handlerType)) {
            console.warn(`[Features] Handler type "${handlerType}" already registered, overwriting`);
          }
          handlerLoaders.set(handlerType, handlerLoader as HandlerLoader);
          console.log(`[Features]   - Registered handler: ${handlerType}`);
        }
      }

      // Step 4: Lazy import feature implementation
      const featureModule = await registryEntry.feature();
      const feature = featureModule.default;

      // Step 5: Initialize feature (heavy deps loaded here)
      await feature.init(config.vars ?? {});
      loadedFeatures.push(feature);

      console.log(`[Features] ✓ Feature loaded: ${featureName} v${feature.version}`);
    } catch (error) {
      console.error(`[Features] ✗ Failed to load feature ${featureName}:`, error);
    }
  }
}

export async function destroyFeatures(): Promise<void> {
  for (const feature of loadedFeatures) {
    if (!feature.destroy) {
      continue;
    }

    try {
      await feature.destroy();
    } catch (error) {
      console.error(`[Features] ✗ Failed to destroy feature ${feature.name}:`, error);
    }
  }

  loadedFeatures = [];
  loadedMetas.clear();
  handlerLoaders.clear();
  loadedHandlers.clear();
}

/**
 * Get loaded feature meta by name
 */
export function getFeatureMeta(name: string): FeatureMeta | undefined {
  return loadedMetas.get(name);
}

/**
 * Get all loaded feature metas
 */
export function getAllLoadedMetas(): FeatureMeta[] {
  return Array.from(loadedMetas.values());
}

/**
 * Resolve a feature handler by type (lazy loaded)
 */
export async function getFeatureHandler(
  type: string
): Promise<{ GET?: RequestHandler; POST?: RequestHandler } | undefined> {
  if (loadedHandlers.has(type)) {
    return loadedHandlers.get(type);
  }

  const loader = handlerLoaders.get(type);
  if (!loader) {
    return undefined;
  }

  try {
    const module = await loader();
    loadedHandlers.set(type, module);
    return module;
  } catch (error) {
    console.error(`[Features] Failed to load handler "${type}":`, error);
    return undefined;
  }
}
