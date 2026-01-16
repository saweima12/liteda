import { defineGadget } from '../define';
import Addon from './Addon.svelte';

export default defineGadget({
  name: 'theme-switcher',
  component: Addon,
  description: 'Toggle between light and dark theme',
  icon: 'sun',
});
