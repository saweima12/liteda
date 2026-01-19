import { createHandler } from '../utils/create-handler.server';
import widget from './meta';

interface ItemCounts {
	MovieCount: number;
	SeriesCount: number;
	EpisodeCount: number;
	SongCount: number;
}

interface Session {
	NowPlayingItem?: {
		Name: string;
	};
}

export const POST = createHandler({
	varsSchema: widget.varsSchema,

	async fetch(vars) {
		const baseUrl = vars.url.replace(/\/$/, '');
		const headers = {
			'X-Emby-Token': vars.key,
		};

		const countsRes = await fetch(`${baseUrl}/Items/Counts`, { headers });

		if (!countsRes.ok) {
			throw new Error(`Jellyfin API failed: ${countsRes.status}`);
		}

		const counts: ItemCounts = await countsRes.json();

		const result: {
			movies: number;
			series: number;
			episodes: number;
			songs: number;
			streams?: number;
		} = {
			movies: counts.MovieCount,
			series: counts.SeriesCount,
			episodes: counts.EpisodeCount,
			songs: counts.SongCount,
		};

		if (vars.showStreams) {
			const sessionsRes = await fetch(`${baseUrl}/Sessions`, { headers });
			if (sessionsRes.ok) {
				const sessions: Session[] = await sessionsRes.json();
				result.streams = sessions.filter((s) => s.NowPlayingItem).length;
			}
		}

		return result;
	},
});
