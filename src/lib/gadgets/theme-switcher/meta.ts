import { defineGadget } from '../define';
import Gadget from './Gadget.svelte';

export default defineGadget({
  name: 'theme-switcher',
  component: Gadget,
  description: 'Toggle between light and dark theme',
  icon: 'sun',
});
