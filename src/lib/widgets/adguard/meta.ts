import { z } from 'zod';
import { defineWidget } from '../utils/define';
import Widget from './Widget.svelte';

const widget = defineWidget({
  name: 'adguard',
  component: Widget,
  description: 'AdGuard Home DNS statistics',
  icon: 'shield',

  dataSchema: z.object({
    queries: z.number(),
    blocked: z.number(),
    filtered: z.number(), // percentage
    latency: z.number(),  // ms
  }),

  varsSchema: z.object({
    url: z.string().url(),
    username: z.string(),
    password: z.string(),
  }),
});

export default widget;