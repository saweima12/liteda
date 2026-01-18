import type { Feature } from '../types';
import { varsSchema } from './meta';
import { closeDockerClient, initDockerClient } from './docker-client';

const dockerDiscovery: Feature = {
  name: 'docker-discovery',
  version: '0.2.0',

  async init(vars) {
    const config = varsSchema.parse(vars);

    initDockerClient({
      socketPath: config.socketPath,
      endpoint: config.endpoint,
      headers: config.headers,
      tls: config.tls,
    });

    console.log('[docker-discovery] Docker client initialized');
  },

  async destroy() {
    closeDockerClient();
    console.log('[docker-discovery] Docker client closed');
  },
};

export default dockerDiscovery;
