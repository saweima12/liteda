import { z } from 'zod';
import { defineWidget } from '../utils/define';
import Widget from './Widget.svelte';

const widget = defineWidget({
	name: 'qbittorrent',
	component: Widget,
	description: 'qBittorrent download client',
	icon: 'download',

	dataSchema: z.object({
		download: z.number(), // bytes/s
		upload: z.number(), // bytes/s
		active: z.number(),
		seeding: z.number(),
	}),

	varsSchema: z.object({
		url: z.string().url(),
		username: z.string().optional(),
		password: z.string().optional(),
	}),
});

export default widget;

export type QBittorrentData = z.infer<typeof widget.dataSchema>;
export type QBittorrentVars = z.infer<NonNullable<typeof widget.varsSchema>>;
