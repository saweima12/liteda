import { z } from 'zod';
import { defineWidget } from '../utils/define';
import Widget from './Widget.svelte';

const widget = defineWidget({
  name: 'nginx-proxy-manager',
  component: Widget,
  description: 'Nginx Proxy Manager proxy hosts',
  icon: 'globe',

  dataSchema: z.object({
    enabled: z.number(),
    disabled: z.number(),
    total: z.number(),
  }),

  varsSchema: z.object({
    url: z.string().url(),
    username: z.string(), // email
    password: z.string(),
  }),
});

export default widget;