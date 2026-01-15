import { createHandler } from '../utils/create-handler';
import widget from './meta';

interface TransferInfo {
	dl_info_speed: number;
	up_info_speed: number;
}

interface Torrent {
	state: string;
}

export const POST = createHandler({
	varsSchema: widget.varsSchema,

	async fetch(vars) {
		const baseUrl = vars.url.replace(/\/$/, '');

		// Login if credentials provided
		if (vars.username && vars.password) {
			const loginRes = await fetch(`${baseUrl}/api/v2/auth/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					username: vars.username,
					password: vars.password,
				}),
			});

			if (!loginRes.ok) {
				throw new Error(`qBittorrent login failed: ${loginRes.status}`);
			}
		}

		const [transferRes, torrentsRes] = await Promise.all([
			fetch(`${baseUrl}/api/v2/transfer/info`),
			fetch(`${baseUrl}/api/v2/torrents/info`),
		]);

		if (!transferRes.ok) {
			throw new Error(`qBittorrent API failed: ${transferRes.status}`);
		}

		const transfer: TransferInfo = await transferRes.json();
		const torrents: Torrent[] = torrentsRes.ok ? await torrentsRes.json() : [];

		// Count active (downloading) and seeding
		const activeStates = ['downloading', 'stalledDL', 'queuedDL', 'forcedDL'];
		const seedingStates = ['uploading', 'stalledUP', 'queuedUP', 'forcedUP'];

		const active = torrents.filter((t) => activeStates.includes(t.state)).length;
		const seeding = torrents.filter((t) => seedingStates.includes(t.state)).length;

		return {
			download: transfer.dl_info_speed,
			upload: transfer.up_info_speed,
			active,
			seeding,
		};
	},
});
