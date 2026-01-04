import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { parse } from 'yaml';
import { join } from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import {
  configSchema,
  settingsSchema,
  servicesFileSchema,
  pageContentSchema,
  blockDefinitionSchema,
  type Config,
  type Settings,
  type ServiceGroup,
  type ServiceItem,
  type BlockDefinition,
  type Page,
  type PageContent,
} from './schema';

const CONFIG_DIR = process.env.CONFIG_DIR || './config';

// Configure marked for security
marked.setOptions({
  gfm: true,
  breaks: true,
});

async function loadYamlFile<T>(filename: string, schema: { parse: (data: unknown) => T }, defaultValue: T): Promise<T> {
  const filepath = join(CONFIG_DIR, filename);

  if (!existsSync(filepath)) {
    console.warn(`Config file not found: ${filepath}, using defaults`);
    return defaultValue;
  }

  try {
    const content = await readFile(filepath, 'utf-8');
    const parsed = parse(content);
    return schema.parse(parsed);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    throw new Error(`Failed to parse ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function loadSettings(): Promise<Settings> {
  return loadYamlFile('settings.yaml', settingsSchema, settingsSchema.parse({}));
}

// Load a specific page content (supports .yaml and .md)
export async function loadPageContent(file: string): Promise<PageContent> {
  const filepath = join(CONFIG_DIR, file);

  if (!existsSync(filepath)) {
    return { services: [] };
  }

  try {
    const content = await readFile(filepath, 'utf-8');
    const isMarkdown = file.endsWith('.md');

    if (isMarkdown) {
      return parseMarkdownPage(content);
    } else {
      return parseYamlPage(content);
    }
  } catch (error) {
    console.error(`Error loading page ${file}:`, error);
    return { services: [] };
  }
}

// Parse YAML page file
function parseYamlPage(content: string): PageContent {
  const parsed = parse(content);

  // Page file can be either:
  // 1. Array of service groups (legacy format, now just "groups")
  // 2. Object with services
  if (Array.isArray(parsed)) {
    return { services: servicesFileSchema.parse(parsed) };
  }

  return pageContentSchema.parse(parsed);
}

// Parse Markdown page file with frontmatter
function parseMarkdownPage(content: string): PageContent {
  const { data: frontmatter, content: markdownBody } = matter(content);

  // Parse frontmatter for services
  let services: ServiceGroup[] = [];
  let blocks: Record<string, BlockDefinition> | undefined;

  if (frontmatter.services) {
    try {
      services = servicesFileSchema.parse(frontmatter.services);
    } catch (e) {
      console.warn('Invalid services in frontmatter:', e);
    }
  }

  // Parse blocks from frontmatter
  if (frontmatter.blocks) {
    try {
      blocks = {};
      for (const [key, value] of Object.entries(frontmatter.blocks)) {
        blocks[key] = blockDefinitionSchema.parse(value);
      }
    } catch (e) {
      console.warn('Invalid blocks in frontmatter:', e);
    }
  }

  // Process markdown body - convert ::: block:xxx ::: to placeholder divs
  const processedMarkdown = markdownBody
    .replace(/::: block:(\w+) :::/g, '<div data-block="$1"></div>');

  // Render markdown body to HTML
  const markdown = processedMarkdown.trim()
    ? marked.parse(processedMarkdown) as string
    : undefined;

  return { services, markdown, blocks };
}

// Get default pages if none defined
function getDefaultPages(hasServices: boolean): Page[] {
  if (hasServices) {
    return [{ id: 'home', name: 'Home', icon: 'home', file: 'services.yaml' }];
  }
  return [];
}

// Load all pages content
export async function loadAllPages(settings: Settings): Promise<Map<string, PageContent>> {
  const pages = settings.pages || getDefaultPages(existsSync(join(CONFIG_DIR, 'services.yaml')));
  const pagesContent = new Map<string, PageContent>();

  for (const page of pages) {
    const content = await loadPageContent(page.file);
    pagesContent.set(page.id, content);
  }

  return pagesContent;
}

export async function loadConfig(): Promise<Config> {
  const [settings] = await Promise.all([
    loadSettings(),
  ]);

  return configSchema.parse({
    settings,
  });
}

export function getConfigDir(): string {
  return CONFIG_DIR;
}

import type { StatusCheckFullConfig } from '$lib/status-check';

/** Widget ID mapping: widgetId -> full config (including vars) */
export interface WidgetRegistry {
  widgets: Map<string, { type: string; interval?: number; vars?: Record<string, unknown> }>;
  /** Maps service to its widget ID */
  serviceWidgetIds: Map<string, string>;
  /** Maps service to its status check ID */
  statusCheckIds: Map<string, string>;
  /** Status check configs */
  statusChecks: Map<string, StatusCheckFullConfig>;
}

/**
 * Extract widgets from page content and generate IDs
 * Returns widget registry and a mapping of widget IDs for each service
 */
export function extractWidgets(
  pages: Map<string, PageContent>,
  pagesList: Page[]
): WidgetRegistry {
  const widgets = new Map<string, { type: string; interval?: number; vars?: Record<string, unknown> }>();
  const serviceWidgetIds = new Map<string, string>();
  const statusCheckIds = new Map<string, string>();
  const statusChecks = new Map<string, StatusCheckFullConfig>();
  let widgetCounter = 0;
  let statusCheckCounter = 0;

  function processItem(item: ServiceItem, pathPrefix: string) {
    const serviceKey = `${pathPrefix}:${item.name}`;

    // Process widget
    if (item.widget) {
      const widgetId = `widget-${++widgetCounter}`;

      widgets.set(widgetId, {
        type: item.widget.type,
        interval: item.widget.interval,
        vars: item.widget.vars,
      });
      serviceWidgetIds.set(serviceKey, widgetId);
    }

    // Process status check (only if no widget - widgets provide their own status)
    if (item.statuscheck && !item.widget) {
      const statusCheckId = `status-${++statusCheckCounter}`;

      // Normalize config
      const config: StatusCheckFullConfig = item.statuscheck === true
        ? {
          url: item.url || '',
          interval: 60000,
          timeout: 5000,
          method: 'HEAD',
          expectedStatus: 200,
        }
        : {
          url: item.statuscheck.url || item.url || '',
          interval: item.statuscheck.interval ?? 60000,
          timeout: item.statuscheck.timeout ?? 5000,
          method: item.statuscheck.method ?? 'HEAD',
          expectedStatus: item.statuscheck.expectedStatus ?? 200,
        };

      if (config.url) {
        statusChecks.set(statusCheckId, config);
        statusCheckIds.set(serviceKey, statusCheckId);
      }
    }
  }

  function processGroup(group: ServiceGroup, pathPrefix: string) {
    if (group.items) {
      for (const item of group.items) {
        processItem(item, `${pathPrefix}:${group.name}`);
      }
    }
    if (group.groups) {
      for (const innerGroup of group.groups) {
        if (innerGroup.items) {
          for (const item of innerGroup.items) {
            processItem(item, `${pathPrefix}:${group.name}:${innerGroup.name}`);
          }
        }
      }
    }
  }

  for (const page of pagesList) {
    const content = pages.get(page.id);
    if (!content) continue;

    // Process services
    for (const group of content.services) {
      processGroup(group, page.id);
    }

    // Process blocks
    if (content.blocks) {
      for (const [blockId, block] of Object.entries(content.blocks)) {
        for (const item of block.items) {
          processItem(item, `${page.id}:block:${blockId}`);
        }
      }
    }
  }

  return { widgets, serviceWidgetIds, statusCheckIds, statusChecks };
}
