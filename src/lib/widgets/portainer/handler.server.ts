import { createHandler } from '../utils/create-handler.server';
import widget from './meta';

interface Container {
  Id: string;
  Names: string[];
  State: string; // "running", "exited", "paused", etc.
}

export const POST = createHandler({
  varsSchema: widget.varsSchema,

  async fetch(vars) {
    const baseUrl = vars.url.replace(/\/+$/, '');

    const response = await fetch(
      `${baseUrl}/api/endpoints/${vars.env}/docker/containers/json?all=1`,
      {
        headers: {
          'X-Api-Key': vars.key,
        },
        // @ts-expect-error - Bun-specific TLS option for self-signed certs
        tls: {
          rejectUnauthorized: false,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Portainer API error: ${response.status} ${response.statusText}`);
    }

    const containers: Container[] = await response.json();

    const running = containers.filter((c) => c.State === 'running').length;
    const stopped = containers.filter((c) => c.State !== 'running').length;
    const total = containers.length;

    return { running, stopped, total };
  },
});