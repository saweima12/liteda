import type { AddonConfig } from './types';

/**
 * Server-side addon configuration store
 * Maps addon instance ID to full config (including vars)
 *
 * This is populated during config load and used by addon handlers
 * to access sensitive configuration without exposing it to the client
 */
let addonConfigs = new Map<string, AddonConfig>();

export function updateAddonConfigs(newConfigs: Map<string, AddonConfig>) {
	addonConfigs = newConfigs;
}

export function getAddonConfig(id: string): AddonConfig | undefined {
	return addonConfigs.get(id);
}

export function getAllAddonConfigs(): Map<string, AddonConfig> {
	return new Map(addonConfigs);
}
