import { derived, type Readable } from 'svelte/store';
import { t } from '$lib/i18n';

/**
 * Create a reactive widget-specific translation function
 * Automatically infers translation path from widget name: widgets.{name}
 * Returns a store that updates automatically when locale changes
 *
 * @example
 * const tw = wt('proxmox');
 * // In template: <Cell label={$tw('labels.vms')}>
 *
 * @param widgetName The widget name (e.g., 'proxmox', 'portainer')
 * @returns Readable store containing translation function for the widget
 */
export function wt(widgetName: string): Readable<(key: string) => string> {
	return derived(t, ($t) => {
		return (key: string) => $t(`widgets.${widgetName}.${key}`);
	});
}
