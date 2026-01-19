import { createHandler } from '../utils/create-handler.server';
import widget from './meta';

interface LibrarySection {
	type: string;
}

interface LibrarySectionsResponse {
	MediaContainer: {
		Directory: LibrarySection[];
	};
}

interface SessionsResponse {
	MediaContainer: {
		size: number;
	};
}

export const POST = createHandler({
	varsSchema: widget.varsSchema,

	async fetch(vars) {
		const baseUrl = vars.url.replace(/\/$/, '');
		const headers = {
			'X-Plex-Token': vars.token,
			Accept: 'application/json',
		};

		const [libraryRes, sessionsRes] = await Promise.all([
			fetch(`${baseUrl}/library/sections`, { headers }),
			fetch(`${baseUrl}/status/sessions`, { headers }),
		]);

		if (!libraryRes.ok) {
			throw new Error(`Plex API failed: ${libraryRes.status}`);
		}

		const library: LibrarySectionsResponse = await libraryRes.json();
		const sessions: SessionsResponse = sessionsRes.ok
			? await sessionsRes.json()
			: { MediaContainer: { size: 0 } };

		// Count library types
		const directories = library.MediaContainer.Directory || [];
		const movies = directories.filter((d) => d.type === 'movie').length;
		const shows = directories.filter((d) => d.type === 'show').length;

		return {
			movies,
			shows,
			streams: sessions.MediaContainer.size || 0,
		};
	},
});
