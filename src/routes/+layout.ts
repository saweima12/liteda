import type { LayoutLoad } from './$types';
import { initI18n } from '$lib/i18n';
import { browser } from '$app/environment';

export const load: LayoutLoad = async ({ data }) => {
	if (browser) {
		// Wait for i18n to initialize before rendering
		await initI18n(data.initialLocale);
	}

	return {
		...data,
	};
};
