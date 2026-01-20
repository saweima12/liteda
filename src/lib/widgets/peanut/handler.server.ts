import { createHandler } from '../utils/create-handler.server';
import widget from './meta';

interface PeanutDevice {
	'battery.charge'?: number;
	'ups.load'?: number;
	'ups.status'?: string;
	[key: string]: unknown;
}

// UPS status code to human-readable description
function getStatusDescription(status: string): string {
	const statusMap: Record<string, string> = {
		'OL': 'Online',
		'OB': 'On Battery',
		'LB': 'Low Battery',
		'HB': 'High Battery',
		'RB': 'Replace Battery',
		'CHRG': 'Charging',
		'DISCHRG': 'Discharging',
		'BYPASS': 'Bypass',
		'CAL': 'Calibrating',
		'OFF': 'Offline',
		'OVER': 'Overload',
		'TRIM': 'Trimming',
		'BOOST': 'Boosting',
	};

	// Status can be multiple codes separated by space
	const codes = status.split(' ');
	const descriptions = codes.map(code => statusMap[code] || code);
	return descriptions.join(', ');
}

export const POST = createHandler({
	varsSchema: widget.varsSchema,

	async fetch(vars) {
		const baseUrl = vars.url.replace(/\/$/, '');
		const upsKey = vars.key || 'ups';

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};

		// Add Basic Auth if username and password provided
		if (vars.username && vars.password) {
			headers['Authorization'] = `Basic ${btoa(`${vars.username}:${vars.password}`)}`;
		}

		const res = await fetch(`${baseUrl}/api/v1/devices/${upsKey}`, { headers });

		if (!res.ok) {
			throw new Error(`PeaNUT API failed: ${res.status}`);
		}

		const data: PeanutDevice = await res.json();

		const batteryCharge = data['battery.charge'] || 0;
		const load = data['ups.load'] || 0;
		const status = data['ups.status'] || 'UNKNOWN';
		const statusDescription = getStatusDescription(status);

		return {
			batteryCharge,
			load,
			status,
			statusDescription,
		};
	},
});
