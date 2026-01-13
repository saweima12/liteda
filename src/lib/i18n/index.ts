import { derived, writable } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import type { Locale } from './locales';
import { defaultLocale } from './locales';

// Current locale
export const locale: Writable<Locale> = writable(defaultLocale);

// Translation data storage - only stores currently loaded locale + fallback
const translations: Record<string, Record<string, any>> = {};

// Track initialization state
let initialized = false;

// Load translations for a specific locale
async function loadTranslations(lang: Locale) {
	try {
		const [common, widgets] = await Promise.all([
			import(`./translations/${lang}/common.json`),
			import(`./translations/${lang}/widgets.json`)
		]);

		translations[lang] = {
			common: common.default,
			widgets: widgets.default
		};
	} catch (error) {
		console.error(`Failed to load translations for locale: ${lang}`, error);
		// If loading fails, try to use fallback
		if (lang !== defaultLocale && !translations[defaultLocale]) {
			await loadTranslations(defaultLocale);
		}
	}
}

// Initialize i18n
export async function initI18n(initialLocale: Locale = defaultLocale) {
	// Prevent duplicate initialization
	if (initialized) {
		return;
	}

	// Always load default locale as fallback
	if (!translations[defaultLocale]) {
		await loadTranslations(defaultLocale);
	}

	// Load requested locale if different from default
	if (initialLocale !== defaultLocale) {
		await loadTranslations(initialLocale);
	}

	locale.set(initialLocale);
	initialized = true;
}

// Switch locale (lazy load on demand)
export async function switchLocale(newLocale: Locale) {
	// Load locale if not already loaded
	if (!translations[newLocale]) {
		await loadTranslations(newLocale);
	}
	locale.set(newLocale);
}

// Get value from nested object by dot notation
function getNestedValue(obj: any, path: string): any {
	const keys = path.split('.');
	let value = obj;

	for (const k of keys) {
		if (value?.[k] === undefined) {
			return undefined;
		}
		value = value[k];
	}

	return value;
}

// Translation function (derived store)
export const t: Readable<(key: string, params?: Record<string, any>) => string> = derived(
	locale,
	($locale) => {
		return (key: string, params?: Record<string, any>): string => {
			// If not initialized yet, return key in uppercase as placeholder
			if (!initialized || Object.keys(translations).length === 0) {
				return key.toUpperCase().replace(/\./g, '.');
			}

			// Try to get translation from current locale
			let value = getNestedValue(translations[$locale], key);

			// Fallback to default locale if not found
			if (value === undefined && $locale !== defaultLocale) {
				value = getNestedValue(translations[defaultLocale], key);

				if (value === undefined) {
					console.warn(`Translation missing: ${key} for locale ${$locale} (also missing in fallback)`);
					return key; // fallback to key itself
				}
			}

			// If still not found in current locale
			if (value === undefined) {
				console.warn(`Translation missing: ${key} for locale ${$locale}`);
				return key;
			}

			// Simple parameter substitution
			if (params && typeof value === 'string') {
				return value.replace(/\{\{(\w+)\}\}/g, (_, param) => String(params[param] ?? ''));
			}

			return value;
		};
	}
);
