import { z } from 'zod';

/**
 * WMO Weather interpretation codes
 * https://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM
 */
export const WEATHER_CODES = {
	0: { text: 'Clear sky', icon: 'sun' },
	1: { text: 'Mainly clear', icon: 'cloud-sun' },
	2: { text: 'Partly cloudy', icon: 'cloud' },
	3: { text: 'Overcast', icon: 'cloud' },
	45: { text: 'Fog', icon: 'cloud-fog' },
	48: { text: 'Depositing rime fog', icon: 'cloud-fog' },
	51: { text: 'Light drizzle', icon: 'cloud-drizzle' },
	53: { text: 'Moderate drizzle', icon: 'cloud-drizzle' },
	55: { text: 'Dense drizzle', icon: 'cloud-drizzle' },
	56: { text: 'Light freezing drizzle', icon: 'cloud-drizzle' },
	57: { text: 'Dense freezing drizzle', icon: 'cloud-drizzle' },
	61: { text: 'Slight rain', icon: 'cloud-rain' },
	63: { text: 'Moderate rain', icon: 'cloud-rain' },
	65: { text: 'Heavy rain', icon: 'cloud-rain' },
	66: { text: 'Light freezing rain', icon: 'cloud-rain' },
	67: { text: 'Heavy freezing rain', icon: 'cloud-rain' },
	71: { text: 'Slight snow fall', icon: 'cloud-snow' },
	73: { text: 'Moderate snow fall', icon: 'cloud-snow' },
	75: { text: 'Heavy snow fall', icon: 'cloud-snow' },
	77: { text: 'Snow grains', icon: 'cloud-snow' },
	80: { text: 'Slight rain showers', icon: 'cloud-rain' },
	81: { text: 'Moderate rain showers', icon: 'cloud-rain' },
	82: { text: 'Violent rain showers', icon: 'cloud-rain' },
	85: { text: 'Slight snow showers', icon: 'cloud-snow' },
	86: { text: 'Heavy snow showers', icon: 'cloud-snow' },
	95: { text: 'Thunderstorm', icon: 'cloud-lightning' },
	96: { text: 'Thunderstorm with slight hail', icon: 'cloud-lightning' },
	99: { text: 'Thunderstorm with heavy hail', icon: 'cloud-lightning' },
} as const;

export type WeatherCode = keyof typeof WEATHER_CODES;

/**
 * Addon configuration variables (from settings.yaml)
 */
export const weatherVarsSchema = z.object({
	// Location (required)
	latitude: z.number().min(-90).max(90),
	longitude: z.number().min(-180).max(180),
	
	// Display
	label: z.string().optional(),
	
	// Units
	units: z.enum(['metric', 'imperial']).default('metric'),
	
	// Behavior
	refresh: z.number().default(600000), // 10 minutes
	cache: z.number().default(5), // 5 minutes server cache
});

/**
 * Full addon config schema (with passthrough for flexibility)
 */
export const weatherConfigSchema = z.object({
	type: z.literal('weather'),
	vars: weatherVarsSchema,
}).passthrough();

export type WeatherVars = z.infer<typeof weatherVarsSchema>;
export type WeatherConfig = z.infer<typeof weatherConfigSchema>;

/**
 * Weather data returned by our API
 */
export interface WeatherData {
	temperature: number;
	feelsLike: number;
	humidity: number;
	windSpeed: number;
	weatherCode: number;
	isDay: boolean;
	label?: string;
	updatedAt: string; // ISO timestamp
}

/**
 * Open-Meteo API response structure
 */
export interface OpenMeteoResponse {
	latitude: number;
	longitude: number;
	timezone: string;
	timezone_abbreviation: string;
	elevation: number;
	current_units: {
		time: string;
		temperature_2m: string;
		relative_humidity_2m: string;
		apparent_temperature: string;
		weather_code: string;
		wind_speed_10m: string;
		is_day: string;
	};
	current: {
		time: string;
		temperature_2m: number;
		relative_humidity_2m: number;
		apparent_temperature: number;
		weather_code: number;
		wind_speed_10m: number;
		is_day: number;
	};
}
