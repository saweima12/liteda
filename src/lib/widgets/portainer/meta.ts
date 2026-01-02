import { z } from 'zod';
import { defineWidget } from '../utils/define';
import Widget from './Widget.svelte';

const widget = defineWidget({
  name: 'portainer',
  component: Widget,
  description: 'Portainer container status',
  icon: 'container',

  dataSchema: z.object({
    running: z.number(),
    stopped: z.number(),
    total: z.number(),
  }),

  varsSchema: z.object({
    url: z.string().url(),
    key: z.string(),
    env: z.number(), // environment ID
  }),
});

export default widget;