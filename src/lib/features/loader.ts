import type { Feature, FeatureConfig } from './types';
import type { PageContent } from '$lib/config/schema';

/**
 * Registry of available features
 * Maps feature name to lazy import function
 *
 * To add a new feature:
 * 1. Create the feature in src/lib/features/<feature-name>/
 * 2. Add an entry here with lazy import
 * 3. Enable it in settings.yaml under `features`
 */
const FEATURES_REGISTRY: Record<string, () => Promise<{ default: Feature }>> = {
  // Example feature (not yet implemented):
  // 'docker-discovery': () => import('./docker-discovery'),
  // 'kubernetes': () => import('./kubernetes'),
  // 'proxmox': () => import('./proxmox'),
};

/**
 * Load and initialize enabled features
 *
 * Features are loaded lazily - only when enabled in config.
 * This allows heavy dependencies (like dockerode) to be optional.
 *
 * @param featuresConfig - Features section from settings.yaml
 * @param pagesContent - Map of page content (features can modify this)
 */
export async function loadFeatures(
  featuresConfig: Record<string, FeatureConfig>,
  pagesContent: Map<string, PageContent>
): Promise<void> {
  const enabledFeatures = Object.entries(featuresConfig).filter(
    ([_, config]) => config.enabled !== false
  );

  if (enabledFeatures.length === 0) {
    return;
  }

  console.log(`Loading ${enabledFeatures.length} feature(s)...`);

  for (const [featureName, config] of enabledFeatures) {
    const featureLoader = FEATURES_REGISTRY[featureName];

    if (!featureLoader) {
      console.warn(`[Features] Unknown feature: ${featureName}`);
      continue;
    }

    try {
      console.log(`[Features] Loading feature: ${featureName}`);

      // Lazy import - only loads if enabled
      const module = await featureLoader();
      const feature = module.default;

      // Initialize feature
      await feature.init(config.vars || {}, pagesContent);

      console.log(`[Features] ✓ Feature loaded: ${featureName} v${feature.version}`);
    } catch (error) {
      console.error(`[Features] ✗ Failed to load feature ${featureName}:`, error);
      // Continue loading other features even if one fails
    }
  }
}
