import { createHandler } from '../utils/create-handler';
import widget from './meta';

interface HeartbeatData {
	heartbeatList: Record<string, Array<{ status: number }>>;
	uptimeList: Record<string, number>;
}

interface StatusPageData {
	incident: {
		id: number;
		title: string;
	} | null;
}

export const POST = createHandler({
	varsSchema: widget.varsSchema,

	async fetch(vars) {
		const baseUrl = vars.url.replace(/\/$/, '');

		const [heartbeatRes, statusRes] = await Promise.all([
			fetch(`${baseUrl}/api/status-page/heartbeat/${vars.slug}`),
			fetch(`${baseUrl}/api/status-page/${vars.slug}`),
		]);

		if (!heartbeatRes.ok) {
			throw new Error(`Heartbeat API failed: ${heartbeatRes.status}`);
		}

		const heartbeat: HeartbeatData = await heartbeatRes.json();
		const status: StatusPageData = statusRes.ok ? await statusRes.json() : { incident: null };

		// Count up/down from heartbeat list
		let up = 0;
		let down = 0;

		for (const monitorHeartbeats of Object.values(heartbeat.heartbeatList)) {
			if (monitorHeartbeats.length > 0) {
				const lastStatus = monitorHeartbeats[monitorHeartbeats.length - 1].status;
				if (lastStatus === 1) {
					up++;
				} else {
					down++;
				}
			}
		}

		// Calculate average uptime from uptimeList
		const uptimeValues = Object.values(heartbeat.uptimeList);
		const uptime =
			uptimeValues.length > 0
				? uptimeValues.reduce((sum, val) => sum + val, 0) / uptimeValues.length
				: 0;

		return {
			up,
			down,
			uptime: Math.round(uptime * 1000) / 10, // Convert to percentage with 1 decimal
			incident: status.incident !== null,
		};
	},
});
