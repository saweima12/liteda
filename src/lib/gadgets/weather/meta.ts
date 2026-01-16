import { defineGadget } from '../define';
import Gadget from './Gadget.svelte';

export default defineGadget({
	name: 'weather',
	component: Gadget,
	description: 'Current weather from Open-Meteo API',
	icon: 'cloud-sun',
});
