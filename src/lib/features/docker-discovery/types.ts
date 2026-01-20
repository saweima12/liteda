export type DockerState = 'running' | 'exited' | 'paused' | 'restarting' | 'created' | 'dead';

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  state: DockerState;
  status: string;
  ports: Array<{ private: number; public?: number; type: string }>;
  url?: string;
}

export type DockerServiceState = 'running' | 'paused' | 'stopped' | 'partial';

export interface DockerServiceInfo {
  id: string;
  name: string;
  image: string;
  state: DockerServiceState;
  replicas: {
    running: number;
    desired: number;
  };
  ports: Array<{ private: number; public?: number; type: string }>;
  url?: string;
}

export type DockerDiscoveryMode = 'container' | 'swarm';

export interface DockerDiscoveryResult {
  mode: DockerDiscoveryMode;
  items: DockerContainer[] | DockerServiceInfo[];
}
