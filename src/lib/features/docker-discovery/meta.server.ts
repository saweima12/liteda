import type { FeatureMeta } from '../types';
import { meta as clientMeta } from './meta.client';

export const meta: FeatureMeta = {
  ...clientMeta,
  handlers: {
    'docker-group': () => import('./handler.server'),
  },
};
