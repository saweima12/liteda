import { createHandler } from '../utils/create-handler.server';
import widget from './meta';

interface HAState {
	entity_id: string;
	state: string;
	attributes: Record<string, unknown>;
}

export const POST = createHandler({
	varsSchema: widget.varsSchema,

	async fetch(vars) {
		const baseUrl = vars.url.replace(/\/$/, '');
		const headers = {
			'Authorization': `Bearer ${vars.token}`,
			'Content-Type': 'application/json',
		};

		// Fetch all entity states
		const statesRes = await fetch(`${baseUrl}/api/states`, { headers });

		if (!statesRes.ok) {
			throw new Error(`Home Assistant API failed: ${statesRes.status}`);
		}

		const states: HAState[] = await statesRes.json();

		// Calculate statistics
		const entities = states.length;

		// Extract unique domains (e.g., "light", "switch", "automation")
		const domains = new Set(states.map(s => s.entity_id.split('.')[0]));

		// Count automations
		const automations = states.filter(s => s.entity_id.startsWith('automation.')).length;

		// Count active automations (state = 'on')
		const activeAutomations = states.filter(
			s => s.entity_id.startsWith('automation.') && s.state === 'on'
		).length;

		return {
			entities,
			domains: domains.size,
			automations,
			activeAutomations,
		};
	},
});
