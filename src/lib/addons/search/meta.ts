import { defineAddon } from '../define';
import Addon from './Addon.svelte';

export default defineAddon({
	name: 'search',
	component: Addon,
	description: 'Global search',
	icon: 'search',
});
