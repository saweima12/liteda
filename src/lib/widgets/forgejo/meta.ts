import { z } from 'zod';
import { defineWidget } from '../utils/define';
import Widget from './Widget.svelte';

const widget = defineWidget({
	name: 'forgejo',
	component: Widget,
	description: 'Forgejo repository statistics (Gitea API compatible)',
	icon: 'git-branch',

	dataSchema: z.object({
		repositories: z.number(),
		stars: z.number(),
		forks: z.number(),
		issues: z.number(),
	}),

	varsSchema: z.object({
		url: z.string().url(),
		token: z.string(),
		username: z.string().optional(), // If provided, show user's repos only
	}),
});

export default widget;

export type ForgejoData = z.infer<typeof widget.dataSchema>;
export type ForgejoVars = z.infer<NonNullable<typeof widget.varsSchema>>;
