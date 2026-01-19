import { createHandler } from '../utils/create-handler.server';
import widget from './meta';

interface WantedResponse {
	totalRecords: number;
}

interface QueueResponse {
	totalRecords: number;
}

interface Series {
	id: number;
	monitored: boolean;
}

export const POST = createHandler({
	varsSchema: widget.varsSchema,

	async fetch(vars) {
		const baseUrl = vars.url.replace(/\/$/, '');
		const headers = {
			'X-Api-Key': vars.key,
		};

		const [wantedRes, queueRes, seriesRes] = await Promise.all([
			fetch(`${baseUrl}/api/v3/wanted/missing?pageSize=1`, { headers }),
			fetch(`${baseUrl}/api/v3/queue?pageSize=1`, { headers }),
			fetch(`${baseUrl}/api/v3/series`, { headers }),
		]);

		if (!wantedRes.ok || !seriesRes.ok) {
			throw new Error(`Sonarr API failed: ${wantedRes.status}`);
		}

		const wanted: WantedResponse = await wantedRes.json();
		const queue: QueueResponse = queueRes.ok ? await queueRes.json() : { totalRecords: 0 };
		const series: Series[] = await seriesRes.json();

		return {
			wanted: wanted.totalRecords,
			queued: queue.totalRecords,
			series: series.filter((s) => s.monitored).length,
		};
	},
});
