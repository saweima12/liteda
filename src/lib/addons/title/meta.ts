import { defineAddon } from '../define';
import Addon from './Addon.svelte';

export default defineAddon({
  name: 'title',
  component: Addon,
  description: 'Display site title from settings',
});
