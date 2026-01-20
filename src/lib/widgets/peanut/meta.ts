import { z } from 'zod';
import { defineWidget } from '../utils/define';
import Widget from './Widget.svelte';

const widget = defineWidget({
	name: 'peanut',
	component: Widget,
	description: 'PeaNUT UPS monitor statistics',
	icon: 'zap',

	dataSchema: z.object({
		batteryCharge: z.number(), // Percentage
		load: z.number(), // Percentage
		status: z.string(), // e.g., "OL" (online), "OB" (on battery), etc.
		statusDescription: z.string(), // Human-readable status
	}),

	varsSchema: z.object({
		url: z.string().url(),
		key: z.string().default('ups'), // UPS device name
		username: z.string().optional(),
		password: z.string().optional(),
	}),
});

export default widget;

export type PeanutData = z.infer<typeof widget.dataSchema>;
export type PeanutVars = z.infer<NonNullable<typeof widget.varsSchema>>;
