import { z } from 'zod';

import type { FeatureMeta } from '../types';

export const varsSchema = z.object({
  enabled: z.boolean().default(true),
  exampleValue: z.string().optional(),
});

export type ExampleFeatureVars = z.infer<typeof varsSchema>;

export const meta: FeatureMeta = {
  name: 'example-feature',
  version: '0.1.0',
  description: 'Template for a feature implementation',
  varsSchema,
};
