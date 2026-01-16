import type { GadgetConfig } from './types';

/**
 * Server-side gadget configuration store
 * Maps gadget instance ID to full config (including vars)
 *
 * This is populated during config load and used by gadget handlers
 * to access sensitive configuration without exposing it to the client
 */
let gadgetConfigs = new Map<string, GadgetConfig>();

export function updateGadgetConfigs(newConfigs: Map<string, GadgetConfig>) {
	gadgetConfigs = newConfigs;
}

export function getGadgetConfig(id: string): GadgetConfig | undefined {
	return gadgetConfigs.get(id);
}

export function getAllGadgetConfigs(): Map<string, GadgetConfig> {
	return new Map(gadgetConfigs);
}
