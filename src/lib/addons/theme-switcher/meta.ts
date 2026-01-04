import { defineAddon } from '../define';
import Addon from './Addon.svelte';

export default defineAddon({
  name: 'theme-switcher',
  component: Addon,
  description: 'Toggle between light and dark theme',
  icon: 'sun',
});
