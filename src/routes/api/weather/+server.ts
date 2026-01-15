import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { WeatherData, OpenMeteoResponse } from '$lib/addons/weather/types';

// Cache for reducing API calls to Open-Meteo
const weatherCache = new Map<
	string,
	{
		data: WeatherData;
		timestamp: number;
	}
>();

/**
 * Generate cache key from coordinates
 */
function getCacheKey(lat: number, lon: number): string {
	// Round to 4 decimal places (~11m precision)
	return `${lat.toFixed(4)},${lon.toFixed(4)}`;
}

/**
 * Get cached weather data if valid
 */
function getCached(key: string, ttlMinutes: number): WeatherData | null {
	const cached = weatherCache.get(key);
	if (!cached) return null;

	const age = Date.now() - cached.timestamp;
	const ttlMs = ttlMinutes * 60 * 1000;

	if (age > ttlMs) {
		weatherCache.delete(key);
		return null;
	}

	return cached.data;
}

/**
 * Store weather data in cache
 */
function setCached(key: string, data: WeatherData): void {
	weatherCache.set(key, {
		data,
		timestamp: Date.now(),
	});
}

/**
 * Fetch weather data from Open-Meteo API
 */
async function fetchOpenMeteo(
	latitude: number,
	longitude: number
): Promise<OpenMeteoResponse> {
	const url = new URL('https://api.open-meteo.com/v1/forecast');
	url.searchParams.set('latitude', latitude.toString());
	url.searchParams.set('longitude', longitude.toString());
	url.searchParams.set(
		'current',
		[
			'temperature_2m',
			'relative_humidity_2m',
			'apparent_temperature',
			'weather_code',
			'wind_speed_10m',
			'is_day',
		].join(',')
	);
	url.searchParams.set('timezone', 'auto');

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

	try {
		const response = await fetch(url.toString(), {
			signal: controller.signal,
		});

		if (!response.ok) {
			throw new Error(`Open-Meteo API error: ${response.status}`);
		}

		return await response.json();
	} finally {
		clearTimeout(timeoutId);
	}
}

/**
 * GET /api/weather
 * Query params:
 *   - latitude: number (required)
 *   - longitude: number (required)
 *   - label: string (optional)
 *   - cache: number (optional, cache TTL in minutes, default 5)
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		// Parse and validate params
		const latStr = url.searchParams.get('latitude');
		const lonStr = url.searchParams.get('longitude');
		const label = url.searchParams.get('label') || undefined;
		const cacheStr = url.searchParams.get('cache');

		if (!latStr || !lonStr) {
			return json(
				{ error: 'Missing required parameters: latitude, longitude' },
				{ status: 400 }
			);
		}

		const latitude = parseFloat(latStr);
		const longitude = parseFloat(lonStr);
		const cacheTtl = cacheStr ? parseInt(cacheStr, 10) : 5;

		if (isNaN(latitude) || isNaN(longitude)) {
			return json({ error: 'Invalid latitude or longitude' }, { status: 400 });
		}

		if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
			return json({ error: 'Latitude/longitude out of range' }, { status: 400 });
		}

		// Check cache
		const cacheKey = getCacheKey(latitude, longitude);
		const cached = getCached(cacheKey, cacheTtl);
		if (cached) {
			return json(cached);
		}

		// Fetch from Open-Meteo
		const response = await fetchOpenMeteo(latitude, longitude);

		// Transform to our format
		const data: WeatherData = {
			temperature: response.current.temperature_2m,
			feelsLike: response.current.apparent_temperature,
			humidity: response.current.relative_humidity_2m,
			windSpeed: response.current.wind_speed_10m,
			weatherCode: response.current.weather_code,
			isDay: response.current.is_day === 1,
			label,
			updatedAt: new Date().toISOString(),
		};

		// Store in cache
		setCached(cacheKey, data);

		return json(data);
	} catch (error) {
		console.error('Failed to fetch weather data:', error);

		if (error instanceof Error && error.name === 'AbortError') {
			return json({ error: 'Request timeout' }, { status: 504 });
		}

		return json({ error: 'Failed to fetch weather data' }, { status: 500 });
	}
};
