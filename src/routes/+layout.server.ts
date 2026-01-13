import type { LayoutServerLoad } from './$types';
import { loadSettings } from '$config';
import { locale } from '$lib/i18n';
import { get } from 'svelte/store';

export const load: LayoutServerLoad = async () => {
  const settings = await loadSettings();

  return {
    customCss: settings.customCss || null,
    initialLocale: get(locale),
  };
};
