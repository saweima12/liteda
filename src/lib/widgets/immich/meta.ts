import { z } from 'zod';
import { defineWidget } from '../utils/define';
import Widget from './Widget.svelte';

const widget = defineWidget({
	name: 'immich',
	component: Widget,
	description: 'Immich photo library statistics',
	icon: 'image',

	dataSchema: z.object({
		photos: z.number(),
		videos: z.number(),
		totalSize: z.string(), // Formatted size string (e.g., "125 GB")
		users: z.number(),
	}),

	varsSchema: z.object({
		url: z.string().url(),
		apiKey: z.string(),
	}),
});

export default widget;

export type ImmichData = z.infer<typeof widget.dataSchema>;
export type ImmichVars = z.infer<NonNullable<typeof widget.varsSchema>>;
