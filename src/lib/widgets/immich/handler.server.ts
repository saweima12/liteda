import { createHandler } from '../utils/create-handler.server';
import widget from './meta';

interface ImmichStats {
	photos: number;
	videos: number;
	usage: number; // Bytes
	usageByUser: Array<{
		userId: string;
		userName: string;
		photos: number;
		videos: number;
		usage: number;
	}>;
}

function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export const POST = createHandler({
	varsSchema: widget.varsSchema,

	async fetch(vars) {
		const baseUrl = vars.url.replace(/\/$/, '');
		const headers = {
			'x-api-key': vars.apiKey,
			'Content-Type': 'application/json',
		};

		const res = await fetch(`${baseUrl}/api/server-info/stats`, { headers });

		if (!res.ok) {
			throw new Error(`Immich API failed: ${res.status}`);
		}

		const stats: ImmichStats = await res.json();

		return {
			photos: stats.photos,
			videos: stats.videos,
			totalSize: formatBytes(stats.usage),
			users: stats.usageByUser?.length || 0,
		};
	},
});
