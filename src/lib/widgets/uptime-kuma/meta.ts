import { z } from 'zod';
import { defineWidget } from '../utils/define';
import Widget from './Widget.svelte';

const widget = defineWidget({
	name: 'uptime-kuma',
	component: Widget,
	description: 'Uptime Kuma status page monitor',
	icon: 'activity',

	dataSchema: z.object({
		up: z.number(),
		down: z.number(),
		uptime: z.number(),
		incident: z.boolean(),
	}),

	varsSchema: z.object({
		url: z.string().url(),
		slug: z.string(),
	}),
});

export default widget;

export type UptimeKumaData = z.infer<typeof widget.dataSchema>;
export type UptimeKumaVars = z.infer<NonNullable<typeof widget.varsSchema>>;
