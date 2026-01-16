import { defineGadget } from '../define';
import Gadget from './Gadget.svelte';

export default defineGadget({
	name: 'search',
	component: Gadget,
	description: 'Global search',
	icon: 'search',
});
