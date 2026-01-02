import { z } from 'zod';
import { defineWidget } from '../utils/define';
import Widget from './Widget.svelte';

const widget = defineWidget({
  name: 'cloudflared',
  component: Widget,
  description: 'Cloudflare Tunnel status',
  icon: 'cloud',

  dataSchema: z.object({
    status: z.string(),
    originIp: z.string().nullable(),
    name: z.string(),
  }),

  varsSchema: z.object({
    accountId: z.string(),
    tunnelId: z.string(),
    key: z.string(), // API token
  }),
});

export default widget;