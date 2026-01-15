import { z } from 'zod';
import { defineWidget } from '../utils/define';
import Widget from './Widget.svelte';

const widget = defineWidget({
	name: 'jellyfin',
	component: Widget,
	description: 'Jellyfin media server statistics',
	icon: 'tv',

	dataSchema: z.object({
		movies: z.number(),
		series: z.number(),
		episodes: z.number(),
		songs: z.number(),
		streams: z.number().optional(),
	}),

	varsSchema: z.object({
		url: z.string().url(),
		key: z.string(),
		showStreams: z.boolean().default(false),
	}),
});

export default widget;

export type JellyfinData = z.infer<typeof widget.dataSchema>;
export type JellyfinVars = z.infer<NonNullable<typeof widget.varsSchema>>;
