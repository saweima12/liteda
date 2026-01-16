import { defineGadget } from '../define';
import Gadget from './Gadget.svelte';
import type { ResourcesConfig } from './types';

export default defineGadget<ResourcesConfig>({
	name: 'resources',
	component: Gadget,
	description: 'System resources monitor (CPU, Memory, Disk, Temperature)',
	icon: 'activity',
});
