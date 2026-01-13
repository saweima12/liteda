/**
 * Auto-discover locales from translation folders
 * Vite will scan ./translations/* at build time
 */
const translationModules = import.meta.glob('./translations/*/common.json');

// Extract locale codes from paths: ./translations/en/common.json -> 'en'
export const locales = Object.keys(translationModules)
	.map((path) => {
		const match = path.match(/\.\/translations\/([^/]+)\/common\.json/);
		return match ? match[1] : null;
	})
	.filter((locale): locale is string => locale !== null)
	.sort(); // Sort alphabetically for consistency

export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
