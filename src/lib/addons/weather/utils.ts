import { WEATHER_CODES, type WeatherCode } from './types';

/**
 * Get weather information (text + icon) from WMO weather code
 */
export function getWeatherInfo(code: number) {
	return (
		WEATHER_CODES[code as WeatherCode] || {
			text: 'Unknown',
			icon: 'help-circle',
		}
	);
}

/**
 * Get weather icon name based on weather code and day/night
 * Special handling for clear/partly cloudy to differentiate day/night
 */
export function getWeatherIcon(code: number, isDay: boolean): string {
	// Clear sky - use sun/moon
	if (code === 0) {
		return isDay ? 'sun' : 'moon';
	}
	
	// Mainly clear or partly cloudy - use cloud-sun/cloud-moon
	if (code >= 1 && code <= 3) {
		return isDay ? 'cloud-sun' : 'cloud-moon';
	}
	
	// Other weather - use standard icon
	const info = getWeatherInfo(code);
	return info.icon;
}

/**
 * Format temperature with unit conversion
 */
export function formatTemp(temp: number, unit: 'metric' | 'imperial'): string {
	if (unit === 'imperial') {
		const fahrenheit = (temp * 9) / 5 + 32;
		return `${Math.round(fahrenheit)}°F`;
	}
	return `${Math.round(temp)}°C`;
}

/**
 * Format wind speed with unit conversion
 */
export function formatWindSpeed(speed: number, unit: 'metric' | 'imperial'): string {
	if (unit === 'imperial') {
		const mph = speed * 0.621371;
		return `${Math.round(mph)} mph`;
	}
	return `${Math.round(speed)} km/h`;
}

/**
 * Get relative time string (e.g. "2 mins ago")
 */
export function getRelativeTime(timestamp: string): string {
	const diff = Date.now() - new Date(timestamp).getTime();
	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (seconds < 60) return 'Just now';
	if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
	if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
	return `${days} day${days > 1 ? 's' : ''} ago`;
}
