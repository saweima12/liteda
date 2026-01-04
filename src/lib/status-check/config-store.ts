// Server-side store for status check configs

export interface StatusCheckFullConfig {
  url: string;
  interval: number;
  timeout: number;
  method: 'GET' | 'HEAD';
  expectedStatus: number;
}

let statusCheckConfigs = new Map<string, StatusCheckFullConfig>();

export function updateStatusCheckConfigs(newConfigs: Map<string, StatusCheckFullConfig>) {
  statusCheckConfigs = newConfigs
}

export function getStatusCheckConfig(id: string): StatusCheckFullConfig | undefined {
  return statusCheckConfigs.get(id);
}
