import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { version } from '../../../package.json';

/**
 * Health check endpoint for Docker HEALTHCHECK
 * Returns basic status information
 */
export const GET: RequestHandler = () => {
	return json({
		status: 'ok',
		version,
		timestamp: new Date().toISOString()
	});
};
