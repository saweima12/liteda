import type { RequestHandler } from '@sveltejs/kit';
import { createFeatureHandler } from '../feature-handler';
import { dockerGroupVarsSchema } from './meta';
import { getDockerClient } from './docker-client';
import { mapContainers, filterByLabels } from './utils';

/**
 * Docker Group API Handler
 * GET /api/features/docker-group?id=<group-id>
 *
 * This handler fetches Docker containers and applies filtering based on labels.
 * URL templates are applied server-side to generate clickable links for each container.
 */
export const GET: RequestHandler = createFeatureHandler({
  varsSchema: dockerGroupVarsSchema,

  async fetch(vars, context) {
    // Extract urlTemplate from group config
    // SECURITY: vars are validated, urlTemplate is retrieved from server-side config
    const urlTemplate =
      typeof context.config.vars?.urlTemplate === 'string'
        ? context.config.vars.urlTemplate
        : undefined;

    // Fetch containers from Docker
    const docker = getDockerClient();
    const rawContainers = await docker.listContainers({ all: true });
    const containers = mapContainers(rawContainers);

    // Filter by labels (include/exclude)
    const filtered = filterByLabels(containers, rawContainers, {
      includeLabels: vars.includeLabels,
      excludeLabels: vars.excludeLabels,
    });

    // Map to response format with URL generation
    return {
      containers: filtered.map((container) => ({
        id: container.id,
        name: container.name,
        image: container.image,
        state: container.state,
        status: container.status,
        // Apply URL template if configured
        // Supports tokens: {name}, {id}, {image}, {state}
        url: urlTemplate
          ? urlTemplate
              .replace('{name}', container.name)
              .replace('{id}', container.id)
              .replace('{image}', container.image)
              .replace('{state}', container.state)
          : undefined,
      })),
    };
  },

  // Cache for configured refresh interval (default: 30s)
  cacheTtl: (vars) => vars.refreshInterval ?? 30000,
});
