import { z } from 'zod';

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
  mode: z.enum(['auto', 'container', 'swarm']).default('auto'),
  enableEventStream: z.boolean().default(false),
});

export type DockerGroupVars = z.infer<typeof dockerGroupVarsSchema>;
