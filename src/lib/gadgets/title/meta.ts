import { defineGadget } from '../define';
import Addon from './Addon.svelte';

export default defineGadget({
  name: 'title',
  component: Addon,
  description: 'Display site title from settings',
});
