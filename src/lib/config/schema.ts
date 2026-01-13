import { z } from 'zod';
import { locales } from '$lib/i18n/locales';

// Widget configuration schema
// - type: widget type name
// - interval: polling interval (client-side, safe to expose)
// - vars: server-side only variables (API keys, secrets, etc.) - NEVER sent to client
export const widgetConfigSchema = z.object({
  type: z.string(),
  interval: z.number().optional(),
  vars: z.record(z.string(), z.unknown()).optional(),
});

// Status check configuration
export const statusCheckConfigSchema = z.union([
  z.literal(true), // Simple mode: use service url
  z.object({
    url: z.string().url().optional(), // Custom check URL
    interval: z.number().optional().default(60000), // Check interval (ms)
    timeout: z.number().optional().default(5000), // Timeout (ms)
    method: z.enum(['GET', 'HEAD']).optional().default('HEAD'),
    expectedStatus: z.number().optional().default(200),
  }),
]);

// Service item schema (also used for bookmark items)
export const serviceItemSchema = z.object({
  name: z.string(),
  icon: z.string().optional(),
  url: z.string().url().optional(),
  description: z.string().optional(),
  target: z.enum(['_blank', '_self']).optional().default('_blank'),
  widget: widgetConfigSchema.optional(),
  statuscheck: statusCheckConfigSchema.optional(),
});

// Inner group schema (for nested groups)
export const innerGroupSchema = z.object({
  name: z.string(),
  icon: z.string().optional(),
  type: z.enum(['services', 'bookmarks']).optional().default('services'),
  columns: z.number().min(1).max(6).optional(),
  equalHeight: z.boolean().optional().default(true),
  showName: z.boolean().optional().default(true),
  items: z.array(serviceItemSchema),
});

// Service group schema (unified for services and bookmarks, supports nesting)
export const serviceGroupSchema = z.object({
  name: z.string(),
  icon: z.string().optional(),
  type: z.enum(['services', 'bookmarks']).optional().default('services'),
  columns: z.number().min(1).max(6).optional(),
  equalHeight: z.boolean().default(true).optional(),
  showName: z.boolean().default(true).optional(),
  // Either items OR groups, not both
  items: z.array(serviceItemSchema).optional(),
  groups: z.array(innerGroupSchema).optional(),
}).refine(
  (data) => {
    // Must have either items or groups, but not both
    const hasItems = data.items && data.items.length > 0;
    const hasGroups = data.groups && data.groups.length > 0;
    return (hasItems || hasGroups) && !(hasItems && hasGroups);
  },
  { message: "Group must have either 'items' or 'groups', not both" }
);

// Page definition schema
export const pageSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().optional(),
  file: z.string(), // yaml file path relative to config/
});

// Addon config schema (for Bar items)
export const addonConfigSchema = z.object({
  type: z.string(),
}).passthrough(); // Allow additional properties for addon-specific config

// Settings schema
export const settingsSchema = z.object({
  title: z.string().optional().default('Homepage'),
  theme: z.enum(['light', 'dark', 'auto']).optional().default('dark'),
  background: z.object({
    image: z.string().optional(),
    color: z.string().optional(),
    opacity: z.number().min(0).max(1).optional().default(0.5),
    blur: z.number().optional().default(0),
  }).optional(),
  favicon: z.string().optional(),
  customCss: z.string().optional(),
  layout: z.object({
    columns: z.number().min(1).max(6).optional().default(3),
    style: z.enum(['grid', 'masonry']).optional().default('grid'),
    header: z.array(addonConfigSchema).optional(),
  }).optional(),
  i18n: z.object({
    locale: z.enum(locales as [string, ...string[]]).optional().default('en'),
  }).optional(),
  pages: z.array(pageSchema).optional(),
});


// Page file schema (array of groups)
export const servicesFileSchema = z.array(serviceGroupSchema);

// Block definition for markdown pages (single level only)
export const blockDefinitionSchema = z.object({
  name: z.string(),
  type: z.enum(['services', 'bookmarks']).optional().default('services'),
  columns: z.number().min(1).max(6).optional(),
  items: z.array(serviceItemSchema),
});

// Page content schema
export const pageContentSchema = z.object({
  services: z.array(serviceGroupSchema).optional().default([]),
  markdown: z.string().optional(),
  blocks: z.record(z.string(), blockDefinitionSchema).optional(),
});

// Full config schema
export const configSchema = z.object({
  settings: settingsSchema,
});

// Type exports
export type AddonConfig = z.infer<typeof addonConfigSchema>;
export type WidgetConfig = z.infer<typeof widgetConfigSchema>;
export type StatusCheckConfig = z.infer<typeof statusCheckConfigSchema>;
export type ServiceItem = z.infer<typeof serviceItemSchema>;
export type InnerGroup = z.infer<typeof innerGroupSchema>;
export type ServiceGroup = z.infer<typeof serviceGroupSchema>;
export type BlockDefinition = z.infer<typeof blockDefinitionSchema>;
export type Page = z.infer<typeof pageSchema>;
export type PageContent = z.infer<typeof pageContentSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type Config = z.infer<typeof configSchema>;
