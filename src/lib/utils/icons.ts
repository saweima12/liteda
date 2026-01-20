/**
 * Get the URL for a service icon.
 * Supports:
 * - Full URLs (http://, https://)
 * - Absolute paths (/)
 * - Icon names (resolved via dashboard-icons CDN)
 */
export function getIconUrl(icon: string | undefined): string | null {
	if (!icon) return null;
	if (icon.startsWith('http://') || icon.startsWith('https://')) return icon;
	if (icon.startsWith('/')) return icon;
	return `https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/${icon}.png`;
}
