import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getCacheStats, purgeExpired } from '$lib/widgets/utils/cache';

/**
 * GET /api/debug/cache-stats
 * Returns cache statistics for debugging
 *
 * Query params:
 *   - purge: boolean (optional) - if true, purge expired entries before returning stats
 */
export const GET: RequestHandler = async ({ url }) => {
	const shouldPurge = url.searchParams.get('purge') === 'true';

	let purgedCount = 0;
	if (shouldPurge) {
		purgedCount = purgeExpired();
	}

	const stats = getCacheStats();

	return json({
		...stats,
		...(shouldPurge ? { purgedCount } : {}),
		timestamp: Date.now(),
	});
};
