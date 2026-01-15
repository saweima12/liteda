import { z } from 'zod';
import { defineWidget } from '../utils/define';
import Widget from './Widget.svelte';

const widget = defineWidget({
	name: 'plex',
	component: Widget,
	description: 'Plex media server statistics',
	icon: 'play-circle',

	dataSchema: z.object({
		movies: z.number(),
		shows: z.number(),
		streams: z.number(),
	}),

	varsSchema: z.object({
		url: z.string().url(),
		token: z.string(),
	}),
});

export default widget;

export type PlexData = z.infer<typeof widget.dataSchema>;
export type PlexVars = z.infer<NonNullable<typeof widget.varsSchema>>;
