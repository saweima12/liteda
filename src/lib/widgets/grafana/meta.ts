import { z } from 'zod';
import { defineWidget } from '../utils/define';
import Widget from './Widget.svelte';

const widget = defineWidget({
	name: 'grafana',
	component: Widget,
	description: 'Grafana dashboard statistics',
	icon: 'chart-line',

	dataSchema: z.object({
		dashboards: z.number(),
		datasources: z.number(),
		alerts: z.number(),
		alertsTriggered: z.number(),
	}),

	varsSchema: z.object({
		url: z.string().url(),
		username: z.string().optional(),
		password: z.string().optional(),
	}),
});

export default widget;

export type GrafanaData = z.infer<typeof widget.dataSchema>;
export type GrafanaVars = z.infer<NonNullable<typeof widget.varsSchema>>;
