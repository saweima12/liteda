export interface FeatureGroupConfig {
  type: string;
  vars?: Record<string, unknown>;
}

let featureConfigs = new Map<string, FeatureGroupConfig>();

export function updateFeatureConfigs(newConfigs: Map<string, FeatureGroupConfig>) {
  featureConfigs = newConfigs;
}

export function getFeatureConfig(id: string): FeatureGroupConfig | undefined {
  return featureConfigs.get(id);
}

export function getAllFeatureConfigs(): Map<string, FeatureGroupConfig> {
  return new Map(featureConfigs);
}
