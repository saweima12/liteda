import { createHandler } from '../utils/create-handler.server';
import widget from './meta';

interface Movie {
	id: number;
	monitored: boolean;
	hasFile: boolean;
}

interface QueueResponse {
	totalRecords: number;
}

export const POST = createHandler({
	varsSchema: widget.varsSchema,

	async fetch(vars) {
		const baseUrl = vars.url.replace(/\/$/, '');
		const headers = {
			'X-Api-Key': vars.key,
		};

		const [moviesRes, queueRes] = await Promise.all([
			fetch(`${baseUrl}/api/v3/movie`, { headers }),
			fetch(`${baseUrl}/api/v3/queue?pageSize=1`, { headers }),
		]);

		if (!moviesRes.ok) {
			throw new Error(`Radarr API failed: ${moviesRes.status}`);
		}

		const movies: Movie[] = await moviesRes.json();
		const queue: QueueResponse = queueRes.ok ? await queueRes.json() : { totalRecords: 0 };

		// Count wanted (monitored but missing file)
		const wanted = movies.filter((m) => m.monitored && !m.hasFile).length;

		return {
			wanted,
			queued: queue.totalRecords,
			movies: movies.length,
		};
	},
});
