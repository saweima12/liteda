import { z } from 'zod';

import type { FeatureMeta } from '../types';

export const varsSchema = z.object({
  socketPath: z.string().default('/var/run/docker.sock'),
  endpoint: z.string().optional(),
  headers: z.record(z.string()).optional(),
  tls: z
    .object({
      ca: z.string().optional(),
      cert: z.string().optional(),
      key: z.string().optional(),
    })
    .optional(),
});

export type DockerDiscoveryVars = z.infer<typeof varsSchema>;

export const dockerGroupVarsSchema = z.object({
  refreshInterval: z.number().default(30000),
  columns: z.number().min(1).max(6).default(3),
  includeLabels: z.array(z.string()).optional(),
  excludeLabels: z.array(z.string()).optional(),
  urlTemplate: z.string().optional(),
});

export type DockerGroupVars = z.infer<typeof dockerGroupVarsSchema>;

export const meta: FeatureMeta = {
  name: 'docker-discovery',
  version: '0.2.0',
  description: 'Discover and monitor Docker containers',
  varsSchema,
  groups: {
    'docker-group': () => import('./components/DockerGroup.svelte'),
  },
  handlers: {
    'docker-group': () => import('./handler'),
  },
};
