import type { RequestHandler } from '@sveltejs/kit';
import { createFeatureHandler } from '../feature-handler.server';
import { dockerGroupVarsSchema } from './meta.shared';
import { getDockerClient } from './docker-client.server';
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

  async fetch(vars) {
    const urlTemplate = vars.urlTemplate;

    const docker = getDockerClient();
    const rawContainers = await docker.listContainers({ all: true });
    const containers = mapContainers(rawContainers);

    const filtered = filterByLabels(containers, rawContainers, {
      includeLabels: vars.includeLabels,
      excludeLabels: vars.excludeLabels,
    });

    return {
      containers: filtered.map((container) => ({
        id: container.id,
        name: container.name,
        image: container.image,
        state: container.state,
        status: container.status,
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
