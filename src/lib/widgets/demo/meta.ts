import { z } from 'zod';
import { defineWidget } from '../utils/define';
import Widget from './Widget.svelte';

const widget = defineWidget({
  name: 'demo',
  component: Widget,
  description: 'Demo widget showing mock data with polling',
  icon: 'activity',

  dataSchema: z.object({
    uptime: z.string(),
    randomValue: z.number(),
    timestamp: z.string(),
    status: z.enum(['healthy', 'degraded', 'down']),
    hasApiKey: z.boolean().optional(),
    hasCustomEndpoint: z.boolean().optional(),
  }),

  varsSchema: z.object({
    apiKey: z.string().optional(),
    endpoint: z.string().url().optional(),
  }).optional(),
});

export default widget;

// Export types inferred from schemas
export type DemoWidgetData = z.infer<typeof widget.dataSchema>;
export type DemoVars = z.infer<NonNullable<typeof widget.varsSchema>>;
