import { readFileSync, existsSync } from 'fs';
import http from 'http';
import https from 'https';

type DockerHttpConfig =
  | {
      kind: 'socket';
      socketPath: string;
      headers?: Record<string, string>;
    }
  | {
      kind: 'tcp';
      baseUrl: URL;
      headers?: Record<string, string>;
      tls?: {
        ca?: Buffer;
        cert?: Buffer;
        key?: Buffer;
      };
    };

type DockerRawContainer = {
  Id: string;
  Names?: string[];
  Image: string;
  State: string;
  Status: string;
  Ports: Array<{ PrivatePort: number; PublicPort?: number; Type: string }>;
  Labels?: Record<string, string>;
};

type DockerClient = {
  listContainers(options: { all: boolean }): Promise<DockerRawContainer[]>;
};

let dockerClient: DockerClient | null = null;

function readTlsFile(path: string | undefined): Buffer | undefined {
  if (!path) return undefined;

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

function createDockerClient(config: DockerHttpConfig): DockerClient {
  return {
    async listContainers(options) {
      const params = new URLSearchParams();
      if (options.all) params.set('all', '1');

      const path = `/containers/json?${params.toString()}`;
      const data = await dockerRequest(config, { method: 'GET', path });
      return parseJson<DockerRawContainer[]>(data, 'listContainers');
    },
  };
}

function parseJson<T>(data: string, context: string): T {
  try {
    return JSON.parse(data) as T;
  } catch (error) {
    const snippet = data.length > 2048 ? `${data.slice(0, 2048)}...` : data;
    throw new Error(`[docker-client] Failed to parse Docker API JSON (${context}): ${String(error)}\n${snippet}`);
  }
}

function joinBasePath(baseUrl: URL, path: string): string {
  const basePath = baseUrl.pathname && baseUrl.pathname !== '/' ? baseUrl.pathname.replace(/\/+$/, '') : '';
  return `${basePath}${path}`;
}

function dockerRequest(
  config: DockerHttpConfig,
  req: { method: 'GET'; path: string }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {
      ...(config.headers ?? {}),
      Accept: 'application/json',
    };

    const onResponse = (res: http.IncomingMessage) => {
      const chunks: string[] = [];
      res.setEncoding('utf8');
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const body = chunks.join('');
        const status = res.statusCode ?? 0;
        if (status >= 200 && status < 300) {
          resolve(body);
          return;
        }
        const statusText = res.statusMessage ? ` ${res.statusMessage}` : '';
        const snippet = body.length > 2048 ? `${body.slice(0, 2048)}...` : body;
        reject(new Error(`[docker-client] Docker API ${req.method} ${req.path} failed: ${status}${statusText}\n${snippet}`));
      });
    };

    if (config.kind === 'socket') {
      const request = http.request(
        {
          socketPath: config.socketPath,
          path: req.path,
          method: req.method,
          headers,
        },
        onResponse
      );

      request.setTimeout(10_000, () => {
        request.destroy(new Error('[docker-client] Docker API request timed out'));
      });
      request.on('error', reject);
      request.end();
      return;
    }

    const isHttps = config.baseUrl.protocol === 'https:';
    const requester = isHttps ? https : http;
    const port = config.baseUrl.port ? Number(config.baseUrl.port) : isHttps ? 443 : 80;

    const request = requester.request(
      {
        protocol: config.baseUrl.protocol,
        hostname: config.baseUrl.hostname,
        port,
        path: joinBasePath(config.baseUrl, req.path),
        method: req.method,
        headers,
        ...(isHttps
          ? {
              ca: config.tls?.ca,
              cert: config.tls?.cert,
              key: config.tls?.key,
            }
          : {}),
      },
      onResponse
    );

    request.setTimeout(10_000, () => {
      request.destroy(new Error('[docker-client] Docker API request timed out'));
    });
    request.on('error', reject);
    request.end();
  });
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
      const baseUrl = new URL(config.endpoint);
      dockerClient = createDockerClient({
        kind: 'tcp',
        baseUrl,
        headers: config.headers,
        tls: {
          ca: readTlsFile(config.tls?.ca),
          cert: readTlsFile(config.tls?.cert),
          key: readTlsFile(config.tls?.key),
        },
      });
      console.log(`[docker-client] Initialized with endpoint: ${config.endpoint}`);
      return;
    }

    const socketPath = config.socketPath ?? '/var/run/docker.sock';
    dockerClient = createDockerClient({ kind: 'socket', socketPath, headers: config.headers });
    console.log(`[docker-client] Initialized with socket: ${socketPath}`);
  } catch (error) {
    console.error('[docker-client] Failed to initialize Docker client:', error);
    throw error;
  }
}

export function getDockerClient(): DockerClient {
  if (!dockerClient) {
    throw new Error('Docker client not initialized');
  }

  return dockerClient;
}

export function closeDockerClient(): void {
  dockerClient = null;
}
