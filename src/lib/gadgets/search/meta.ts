import { defineGadget } from '../define';
import Addon from './Addon.svelte';

export default defineGadget({
	name: 'search',
	component: Addon,
	description: 'Global search',
	icon: 'search',
});
