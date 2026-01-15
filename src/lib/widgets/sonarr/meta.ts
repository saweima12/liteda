import { z } from 'zod';
import { defineWidget } from '../utils/define';
import Widget from './Widget.svelte';

const widget = defineWidget({
	name: 'sonarr',
	component: Widget,
	description: 'Sonarr TV show management',
	icon: 'tv-2',

	dataSchema: z.object({
		wanted: z.number(),
		queued: z.number(),
		series: z.number(),
	}),

	varsSchema: z.object({
		url: z.string().url(),
		key: z.string(),
	}),
});

export default widget;

export type SonarrData = z.infer<typeof widget.dataSchema>;
export type SonarrVars = z.infer<NonNullable<typeof widget.varsSchema>>;
