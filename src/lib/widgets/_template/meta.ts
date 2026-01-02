/**
 * Widget Template - meta.ts
 * 
 * Copy this folder and rename it to create a new Widget
 * Example: cp -r _template my-widget
 */
import { z } from 'zod';
import { defineWidget } from '../utils/define';
import Widget from './Widget.svelte';

const widget = defineWidget({
  name: '_template', // <- Change to your widget name
  component: Widget,
  description: 'Widget description',
  icon: 'box', // Lucide icon name

  // Define your widget data structure
  dataSchema: z.object({
    // Example:
    // status: z.enum(['online', 'offline']),
    // value: z.number(),
    // message: z.string(),
  }),

  // Define server-side configuration (optional)
  // These variables only exist on the server, never sent to client
  varsSchema: z.object({
    // Example:
    // apiKey: z.string(),
    // endpoint: z.string().url(),
  }).optional(),
});

export default widget;

// Export types inferred from schemas
export type WidgetData = z.infer<typeof widget.dataSchema>;
export type WidgetVars = z.infer<NonNullable<typeof widget.varsSchema>>;
