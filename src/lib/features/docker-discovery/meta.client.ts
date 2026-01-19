import type { FeatureMeta } from '../types';
import { varsSchema } from './meta.shared';

export const meta: FeatureMeta = {
  name: 'docker-discovery',
  version: '0.2.0',
  description: 'Discover and monitor Docker containers',
  varsSchema,
  groups: {
    'docker-group': () => import('./components/DockerGroup.svelte'),
  },
};
