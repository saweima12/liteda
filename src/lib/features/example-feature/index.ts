import type { Feature } from '../types';
import { varsSchema } from './meta';
const exampleFeature: Feature = {
  name: 'example-feature',
  version: '0.1.0',

  async init(vars) {
    const config = varsSchema.parse(vars);

    if (!config.enabled) {
      return;
    }
  },
};

export default exampleFeature;
