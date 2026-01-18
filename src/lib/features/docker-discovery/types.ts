export type DockerState = 'running' | 'exited' | 'paused' | 'restarting' | 'created' | 'dead';

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  state: DockerState;
  status: string;
  ports: Array<{ private: number; public?: number; type: string }>;
}
