import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFeatureHandler } from '$lib/features';

export const GET: RequestHandler = async (event) => {
  const { feature } = event.params;

  const handler = await getFeatureHandler(feature);
  if (!handler?.GET) {
    throw error(404, { message: `No GET handler for feature '${feature}'` });
  }

  try {
    return handler.GET(event);
  } catch (e) {
    console.error(`Feature ${feature} GET error:`, e);
    throw error(500, {
      message: e instanceof Error ? e.message : 'Failed to fetch feature data',
    });
  }
};

export const POST: RequestHandler = async (event) => {
  const { feature } = event.params;

  const handler = await getFeatureHandler(feature);
  if (!handler?.POST) {
    throw error(404, { message: `No POST handler for feature '${feature}'` });
  }

  try {
    return handler.POST(event);
  } catch (e) {
    console.error(`Feature ${feature} POST error:`, e);
    throw error(500, {
      message: e instanceof Error ? e.message : 'Failed to process feature request',
    });
  }
};
