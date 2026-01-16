import { defineGadget } from '../define';
import Gadget from './Gadget.svelte';

export default defineGadget({
  name: 'title',
  component: Gadget,
  description: 'Display site title from settings',
});
