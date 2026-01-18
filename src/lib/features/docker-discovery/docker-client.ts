import { readFileSync, existsSync } from 'fs';
import Docker from 'dockerode';

let dockerClient: Docker | null = null;

function parseEndpoint(endpoint: string): { protocol?: 'http' | 'https'; host?: string; port?: number } {
  const url = new URL(endpoint);
  return {
    protocol: url.protocol === 'https:' ? 'https' : 'http',
    host: url.hostname,
    port: url.port ? Number(url.port) : undefined,
  };
}

function readTlsFile(path: string | undefined): Buffer | undefined {
  if (!path) {
    return undefined;
  }

  if (!existsSync(path)) {
    console.warn(`[docker-client] TLS file not found: ${path}`);
    return undefined;
  }

  try {
    return readFileSync(path);
  } catch (error) {
    console.error(`[docker-client] Failed to read TLS file ${path}:`, error);
    return undefined;
  }
}

export function initDockerClient(config: {
  socketPath?: string;
  endpoint?: string;
  headers?: Record<string, string>;
  tls?: {
    ca?: string;
    cert?: string;
    key?: string;
  };
} = {}): void {
  try {
    if (config.endpoint) {
      const endpointConfig = parseEndpoint(config.endpoint);
      dockerClient = new Docker({
        ...endpointConfig,
        headers: config.headers,
        ca: readTlsFile(config.tls?.ca),
        cert: readTlsFile(config.tls?.cert),
        key: readTlsFile(config.tls?.key),
      });
      console.log(`[docker-client] Initialized with endpoint: ${config.endpoint}`);
      return;
    }

    const socketPath = config.socketPath ?? '/var/run/docker.sock';
    dockerClient = new Docker({ socketPath });
    console.log(`[docker-client] Initialized with socket: ${socketPath}`);
  } catch (error) {
    console.error('[docker-client] Failed to initialize Docker client:', error);
    throw error;
  }
}

export function getDockerClient(): Docker {
  if (!dockerClient) {
    throw new Error('Docker client not initialized');
  }

  return dockerClient;
}

export function closeDockerClient(): void {
  dockerClient = null;
}
