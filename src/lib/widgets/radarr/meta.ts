import { z } from 'zod';
import { defineWidget } from '../utils/define';
import Widget from './Widget.svelte';

const widget = defineWidget({
	name: 'radarr',
	component: Widget,
	description: 'Radarr movie management',
	icon: 'film',

	dataSchema: z.object({
		wanted: z.number(),
		queued: z.number(),
		movies: z.number(),
	}),

	varsSchema: z.object({
		url: z.string().url(),
		key: z.string(),
	}),
});

export default widget;

export type RadarrData = z.infer<typeof widget.dataSchema>;
export type RadarrVars = z.infer<NonNullable<typeof widget.varsSchema>>;
