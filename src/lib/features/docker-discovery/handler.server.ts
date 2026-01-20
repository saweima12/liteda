import type { RequestHandler } from '@sveltejs/kit';
import { createFeatureHandler } from '../feature-handler.server';
import { dockerGroupVarsSchema } from './meta.shared';
import { getDockerClient } from './docker-client.server';
import { mapContainers, filterByLabels, mapServices, filterServicesByLabels } from './utils';
import type { DockerContainer, DockerServiceInfo } from './types';

/**
 * Docker Group API Handler
 * GET /api/features/docker-group?id=<group-id>
 *
 * This handler fetches Docker containers or Swarm services based on configuration.
 * Supports automatic mode detection or explicit mode selection.
 * URL templates are applied server-side to generate clickable links for each item.
 */
export const GET: RequestHandler = createFeatureHandler({
  varsSchema: dockerGroupVarsSchema,

  async fetch(vars) {
    const docker = getDockerClient();
    const urlTemplate = vars.urlTemplate;

    // Determine which mode to use
    let useSwarmMode = false;
    if (vars.mode === 'swarm') {
      useSwarmMode = true;
    } else if (vars.mode === 'auto') {
      useSwarmMode = await docker.checkSwarmMode();
    }

    if (useSwarmMode) {
      // Swarm mode: fetch services and tasks
      const rawServices = await docker.listServices();

      // Fetch tasks for each service
      const tasksMap = new Map();
      await Promise.all(
        rawServices.map(async (service) => {
          const tasks = await docker.getServiceTasks(service.ID);
          tasksMap.set(service.ID, tasks);
        })
      );

      const services = mapServices(rawServices, tasksMap);
      const filtered = filterServicesByLabels(services, rawServices, {
        includeLabels: vars.includeLabels,
        excludeLabels: vars.excludeLabels,
      });

      return {
        mode: 'swarm' as const,
        items: filtered.map((service) => ({
          id: service.id,
          name: service.name,
          image: service.image,
          state: service.state,
          replicas: service.replicas,
          url: urlTemplate
            ? urlTemplate
                .replace('{name}', service.name)
                .replace('{id}', service.id)
                .replace('{image}', service.image)
                .replace('{state}', service.state)
            : undefined,
        })),
      };
    } else {
      // Container mode: fetch containers
      const rawContainers = await docker.listContainers({ all: true });
      const containers = mapContainers(rawContainers);

      const filtered = filterByLabels(containers, rawContainers, {
        includeLabels: vars.includeLabels,
        excludeLabels: vars.excludeLabels,
      });

      return {
        mode: 'container' as const,
        items: filtered.map((container) => ({
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
    }
  },

  // Cache for configured refresh interval (default: 30s)
  cacheTtl: (vars) => vars.refreshInterval ?? 30000,
});
