import { z } from 'zod';
import { defineWidget } from '../utils/define';
import Widget from './Widget.svelte';

const widget = defineWidget({
  name: 'proxmox',
  component: Widget,
  description: 'Proxmox VE cluster status',
  icon: 'server',

  dataSchema: z.object({
    vms: z.object({
      running: z.number(),
      total: z.number(),
    }),
    lxc: z.object({
      running: z.number(),
      total: z.number(),
    }),
    cpu: z.number(), // percentage 0-100
    mem: z.number(), // percentage 0-100
    node: z.string().optional(),
  }),

  varsSchema: z.object({
    url: z.string().url(), 
    username: z.string(), // format: user@realm!tokenid
    password: z.string(), // API token secret
    node: z.string().optional(), // specific node, or cluster average
  }),
});

export default widget;