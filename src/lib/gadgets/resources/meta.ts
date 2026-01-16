import { defineGadget } from '../define';
import Addon from './Addon.svelte';
import type { ResourcesConfig } from './types';

export default defineGadget<ResourcesConfig>({
	name: 'resources',
	component: Addon,
	description: 'System resources monitor (CPU, Memory, Disk, Temperature)',
	icon: 'activity',
});
