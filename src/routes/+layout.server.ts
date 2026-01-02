import type { LayoutServerLoad } from './$types';
import { loadSettings } from '$config';

export const load: LayoutServerLoad = async () => {
  const settings = await loadSettings();
  
  return {
    customCss: settings.customCss || null,
  };
};
