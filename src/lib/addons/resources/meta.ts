import { defineAddon } from '../define';
import Addon from './Addon.svelte';
import type { ResourcesConfig } from './types';

export default defineAddon<ResourcesConfig>({
	name: 'resources',
	component: Addon,
	description: 'System resources monitor (CPU, Memory, Disk, Temperature)',
	icon: 'activity',
});
