import { defineAddon } from '../define';
import Addon from './Addon.svelte';

export default defineAddon({
	name: 'weather',
	component: Addon,
	description: 'Current weather from Open-Meteo API',
	icon: 'cloud-sun',
});
