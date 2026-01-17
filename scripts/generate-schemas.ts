/**
 * Generate JSON Schemas from Zod schemas for YAML configuration files.
 * This enables IDE autocompletion and validation in VS Code with YAML extension.
 *
 * Automatically discovers widget and gadget schemas from their source files.
 *
 * Usage: bun run scripts/generate-schemas.ts
 */

import { writeFile, mkdir, readdir } from 'fs/promises';
import { join } from 'path';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { z, type ZodTypeAny } from 'zod';

const ROOT = process.cwd();
const WIDGETS_DIR = join(ROOT, 'src/lib/widgets');
const GADGETS_DIR = join(ROOT, 'src/lib/gadgets');

// ============================================================================
// Dynamic Schema Discovery
// ============================================================================

async function discoverWidgetSchemas(): Promise<Record<string, ZodTypeAny>> {
	const schemas: Record<string, ZodTypeAny> = {};
	const entries = await readdir(WIDGETS_DIR, { withFileTypes: true });

	// Directories to skip (not actual widgets)
	const skipDirs = new Set(['utils', 'types']);

	for (const entry of entries) {
		if (!entry.isDirectory() || entry.name.startsWith('_') || skipDirs.has(entry.name)) continue;

		const metaPath = join(WIDGETS_DIR, entry.name, 'meta.ts');
		try {
			const module = await import(metaPath);
			const widget = module.default;

			if (widget?.varsSchema) {
				schemas[widget.name] = widget.varsSchema.describe(widget.description || `${widget.name} widget`);
			}
		} catch (err) {
			console.warn(`Warning: Could not load widget ${entry.name}:`, (err as Error).message);
		}
	}

	return schemas;
}

async function discoverGadgetSchemas(): Promise<Record<string, ZodTypeAny>> {
	const schemas: Record<string, ZodTypeAny> = {};
	const entries = await readdir(GADGETS_DIR, { withFileTypes: true });

	// Directories to skip (not actual gadgets)
	const skipDirs = new Set(['utils', 'types']);

	for (const entry of entries) {
		if (!entry.isDirectory() || entry.name.startsWith('_') || skipDirs.has(entry.name)) continue;

		// Try to load types.ts first (for gadgets with varsSchema)
		const typesPath = join(GADGETS_DIR, entry.name, 'types.ts');
		const metaPath = join(GADGETS_DIR, entry.name, 'meta.ts');

		try {
			// Try types.ts for varsSchema
			try {
				const typesModule = await import(typesPath);
				const varsSchemaKey = `${entry.name.replace(/-/g, '')}VarsSchema`;
				const varsSchema = typesModule[varsSchemaKey] || typesModule.varsSchema;

				if (varsSchema) {
					const metaModule = await import(metaPath);
					const gadget = metaModule.default;
					schemas[entry.name] = varsSchema.optional().describe(gadget?.description || `${entry.name} gadget`);
					continue;
				}
			} catch {
				// types.ts doesn't exist or doesn't have varsSchema
			}

			// Fallback: gadget without varsSchema (empty object)
			const metaModule = await import(metaPath);
			const gadget = metaModule.default;
			if (gadget?.name) {
				schemas[entry.name] = z.object({}).optional().describe(gadget.description || `${entry.name} gadget`);
			}
		} catch (err) {
			console.warn(`Warning: Could not load gadget ${entry.name}:`, (err as Error).message);
		}
	}

	return schemas;
}

// ============================================================================
// Build Combined Schemas
// ============================================================================

async function buildSchemas() {
	console.log('Discovering widget schemas...');
	const widgetSchemas = await discoverWidgetSchemas();
	console.log(`  Found ${Object.keys(widgetSchemas).length} widgets:`, Object.keys(widgetSchemas).join(', '));

	console.log('Discovering gadget schemas...');
	const gadgetSchemas = await discoverGadgetSchemas();
	console.log(`  Found ${Object.keys(gadgetSchemas).length} gadgets:`, Object.keys(gadgetSchemas).join(', '));

	// Widget config with discriminated union for vars
	const widgetVarsSchemas = Object.entries(widgetSchemas).map(([type, varsSchema]) =>
		z.object({
			type: z.literal(type),
			interval: z.number().optional().describe('Polling interval in milliseconds'),
			vars: varsSchema,
		})
	);

	const widgetConfigSchema =
		widgetVarsSchemas.length > 0
			? z
					.discriminatedUnion('type', widgetVarsSchemas as [z.ZodObject<any>, ...z.ZodObject<any>[]])
					.describe('Widget configuration')
			: z.object({ type: z.string() }).describe('Widget configuration');

	// Gadget config with discriminated union for vars
	// Including 'group' type for recursive gadget containers
	const gadgetVarsSchemas = Object.entries(gadgetSchemas).map(([type, varsSchema]) =>
		z.object({
			type: z.literal(type),
			vars: varsSchema,
		})
	);

	// Add 'group' type that can contain nested gadgets
	const groupGadgetSchema = z.object({
		type: z.literal('group'),
		vars: z.object({
			align: z.enum(['left', 'center', 'right']).default('center').describe('Group alignment (left, center, right)'),
			items: z.array(z.any()).describe('Nested gadgets in this group (supports all gadget types including nested groups)'),
		}).optional().describe('Group configuration with nested gadgets'),
	}).describe('Gadget group container');

	// Combine all gadget schemas including group
	const allGadgetSchemas = [...gadgetVarsSchemas, groupGadgetSchema];

	const gadgetConfigSchema =
		allGadgetSchemas.length > 0
			? z
					.discriminatedUnion('type', allGadgetSchemas as [z.ZodObject<any>, ...z.ZodObject<any>[]])
					.describe('Header gadget configuration')
			: z.object({ type: z.string() }).describe('Header gadget configuration');

	// Status check configuration
	const statusCheckConfigSchema = z.union([
		z.literal(true).describe('Simple mode: use service URL for health check'),
		z
			.object({
				url: z.string().url().optional().describe('Custom health check URL'),
				interval: z.number().default(60000).describe('Check interval in milliseconds'),
				timeout: z.number().default(5000).describe('Request timeout in milliseconds'),
				method: z.enum(['GET', 'HEAD']).default('HEAD').describe('HTTP method'),
				expectedStatus: z.number().default(200).describe('Expected HTTP status code'),
			})
			.describe('Advanced status check configuration'),
	]);

	// Service item schema
	const serviceItemSchema = z
		.object({
			name: z.string().describe('Service display name'),
			icon: z.string().optional().describe('Icon name from Dashboard Icons or Lucide'),
			url: z.string().url().optional().describe('Service URL'),
			description: z.string().optional().describe('Short description'),
			target: z.enum(['_blank', '_self']).default('_blank').describe('Link target'),
			widget: widgetConfigSchema.optional(),
			statuscheck: statusCheckConfigSchema.optional(),
		})
		.describe('Service or bookmark item');

	// Inner group schema (for nested groups)
	const innerGroupSchema = z
		.object({
			name: z.string().describe('Group name'),
			icon: z.string().optional().describe('Group icon'),
			type: z.enum(['services', 'bookmarks']).default('services').describe('Display type'),
			columns: z.number().min(1).max(6).optional().describe('Number of columns (1-6)'),
			equalHeight: z.boolean().default(true).describe('Equal height items'),
			showName: z.boolean().default(true).describe('Show group name'),
			items: z.array(serviceItemSchema).describe('Items in this group'),
		})
		.describe('Nested group within a service group');

	// Service group schema
	const serviceGroupSchema = z
		.object({
			name: z.string().describe('Group name'),
			icon: z.string().optional().describe('Group icon'),
			type: z.enum(['services', 'bookmarks']).default('services').describe('Display type'),
			columns: z.number().min(1).max(6).optional().describe('Number of columns (1-6)'),
			equalHeight: z.boolean().default(true).describe('Equal height items'),
			showName: z.boolean().default(true).describe('Show group name'),
			items: z.array(serviceItemSchema).optional().describe('Items (use this OR groups, not both)'),
			groups: z.array(innerGroupSchema).optional().describe('Nested groups (use this OR items, not both)'),
		})
		.describe('Service group containing items or nested groups');

	// Services file schema (array of groups)
	const servicesFileSchema = z.array(serviceGroupSchema).describe('Array of service groups');

	// Available locales
	const availableLocales = ['en', 'zh'] as const;

	// Page definition schema
	const pageSchema = z
		.object({
			id: z.string().describe('Unique page identifier'),
			name: z.string().describe('Page display name'),
			icon: z.string().optional().describe('Page icon'),
			file: z.string().describe('YAML or Markdown file path relative to config/'),
		})
		.describe('Page configuration');

	// Settings schema
	const settingsSchema = z
		.object({
			title: z.string().default('Homepage').describe('Site title'),
			theme: z.enum(['light', 'dark', 'auto']).default('dark').describe('Color theme'),
			background: z
				.object({
					image: z.string().optional().describe('Background image URL'),
					color: z.string().optional().describe('Background color (CSS)'),
					opacity: z.number().min(0).max(1).default(0.5).describe('Background opacity (0-1)'),
					blur: z.number().default(0).describe('Background blur in pixels'),
				})
				.optional()
				.describe('Background configuration'),
			favicon: z.string().optional().describe('Favicon URL'),
			customCss: z.string().optional().describe('Custom CSS styles'),
			layout: z
				.object({
					columns: z.number().min(1).max(6).default(3).describe('Number of columns (1-6)'),
					style: z.enum(['grid', 'masonry']).default('grid').describe('Layout style'),
					header: z.array(gadgetConfigSchema).optional().describe('Header gadgets'),
				})
				.optional()
				.describe('Layout configuration'),
			i18n: z
				.object({
					locale: z.enum(availableLocales).default('en').describe('Interface language'),
				})
				.optional()
				.describe('Internationalization settings'),
			pages: z.array(pageSchema).optional().describe('Additional pages'),
		})
		.describe('Global settings configuration');

	// Block definition for markdown pages
	const blockDefinitionSchema = z
		.object({
			name: z.string().describe('Block name'),
			type: z.enum(['services', 'bookmarks']).default('services').describe('Display type'),
			columns: z.number().min(1).max(6).optional().describe('Number of columns (1-6)'),
			items: z.array(serviceItemSchema).describe('Items in this block'),
		})
		.describe('Service block for markdown pages');

	// Markdown frontmatter schema
	const markdownFrontmatterSchema = z
		.object({
			blocks: z
				.record(z.string(), blockDefinitionSchema)
				.optional()
				.describe('Named blocks that can be embedded in markdown with {{block:name}}'),
		})
		.describe('Markdown page frontmatter');

	return { settingsSchema, servicesFileSchema, markdownFrontmatterSchema };
}

// ============================================================================
// Generate JSON Schema Files
// ============================================================================

async function generateSchemas() {
	const { settingsSchema, servicesFileSchema, markdownFrontmatterSchema } = await buildSchemas();

	const schemasDir = join(ROOT, 'config', 'schemas');
	await mkdir(schemasDir, { recursive: true });

	const schemas = [
		{
			name: 'settings',
			schema: settingsSchema,
			description: 'Liteda settings.yaml configuration',
		},
		{
			name: 'services',
			schema: servicesFileSchema,
			description: 'Liteda services/pages YAML configuration',
		},
		{
			name: 'frontmatter',
			schema: markdownFrontmatterSchema,
			description: 'Liteda markdown page frontmatter',
		},
	];

	for (const { name, schema, description } of schemas) {
		const jsonSchema = zodToJsonSchema(schema, {
			name,
			$refStrategy: 'none', // Inline all definitions for better IDE support
		});

		// Add schema metadata
		const fullSchema = {
			$schema: 'http://json-schema.org/draft-07/schema#',
			title: `Liteda ${name} schema`,
			description,
			...jsonSchema,
		};

		const filePath = join(schemasDir, `${name}.schema.json`);
		await writeFile(filePath, JSON.stringify(fullSchema, null, 2));
		console.log(`Generated: ${filePath}`);
	}

	console.log('\nDone! Schemas are auto-associated via .vscode/settings.json');
}

generateSchemas().catch(console.error);
