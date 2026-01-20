import { z } from 'zod';
import { defineWidget } from '../utils/define';
import Widget from './Widget.svelte';

const widget = defineWidget({
	name: 'home-assistant',
	component: Widget,
	description: 'Home Assistant statistics',
	icon: 'home',

	dataSchema: z.object({
		entities: z.number(),
		domains: z.number(),
		automations: z.number(),
		activeAutomations: z.number(),
	}),

	varsSchema: z.object({
		url: z.string().url(),
		token: z.string(),
	}),
});

export default widget;

export type HomeAssistantData = z.infer<typeof widget.dataSchema>;
export type HomeAssistantVars = z.infer<NonNullable<typeof widget.varsSchema>>;
