# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Liteda is a lightweight homelab dashboard built with SvelteKit. It provides a configurable interface for managing services, widgets, and markdown content. The app is designed to be memory-efficient (~50-80MB) with a focus on SSR proxy capabilities to avoid CORS issues.

## Commands

```bash
# Install dependencies (uses Bun)
bun install

# Development server (http://0.0.0.0:5173)
bun dev

# Build for production
bun run build

# Preview production build
bun preview

# Type checking
bun run check
```

## Architecture

### Configuration System

The app uses a YAML-based configuration system located in `config/`:
- `settings.yaml` - Global settings (theme, layout, pages)
- `services.yaml` - Default home page services
- `pages/*.yaml` - Additional YAML pages
- `pages/*.md` - Markdown pages with frontmatter

**Configuration Loading Flow:**
1. At server startup (`src/hooks.server.ts`), the `init` hook loads all config files
2. `src/lib/config/loader.ts` handles YAML/Markdown parsing with Zod validation
3. Widgets and status checks are extracted from all pages and assigned unique IDs
4. Config is cached in `src/lib/config/cache.ts` to avoid re-parsing on each request
5. Widget configs (including sensitive `vars`) are stored server-side only

### Widget System

Widgets are auto-discovered components that display live data from services. They use a three-file structure:

```
src/lib/widgets/my-widget/
├── meta.ts       # Widget definition + Zod schemas
├── handler.ts    # Server-side data fetching (POST handler)
└── Widget.svelte # UI component
```

**Widget Flow:**
1. Widget metadata is auto-scanned at build time via Vite glob (`src/lib/widgets/registry.ts`)
2. Client sends POST to `/api/widgets/[type]` with widget ID
3. Dynamic route handler (`src/routes/api/widgets/[type]/+server.ts`) auto-discovers handlers
4. Handler uses `createHandler()` utility which provides:
   - Server-side caching with TTL (default: widget interval or 5s)
   - Thundering herd prevention (concurrent requests share same promise)
   - Zod validation for vars
   - Standardized error handling
5. Client uses `useWidget()` composable (`src/lib/widgets/utils/state.svelte.ts`) to poll and manage state

**Important:** Widget `vars` (API keys, secrets) are NEVER sent to the client. The server fetches using the full config stored in `src/lib/widgets/config-store.ts`.

### Addon System

Addons are header bar components that use auto-discovery similar to widgets:

```
src/lib/addons/my-addon/
├── meta.ts      # Addon definition with defineAddon()
└── Addon.svelte # UI component
```

Auto-scanned via `src/lib/addons/registry.ts`. Configured in `settings.yaml` under `layout.header`.

### Server-Side Rendering & Caching

- **SSR Proxy:** Widget handlers run server-side to avoid CORS issues
- **Config Cache:** Config is loaded once at startup (`hooks.server.ts`) and cached in memory
- **Widget Data Cache:** `src/lib/widgets/utils/cache.ts` provides TTL-based caching with thundering herd prevention
- **Status Checks:** Similar polling system for service availability in `src/lib/status-check/`

### Path Aliases

Configured in `svelte.config.js`:
- `$components` → `src/lib/components`
- `$widgets` → `src/lib/widgets`
- `$config` → `src/lib/config`

### UI Components

- Base UI from shadcn-svelte (Tailwind + Bits-UI) in `src/lib/components/ui/`
- Widget-specific UI helpers in `src/lib/components/widget-ui/` (Block, Row, Cell, Status, Metric, Progress)
- Icons via unplugin-icons (Lucide icons as Svelte components)
- Service icons via Dashboard Icons CDN

**Important - Use shadcn-svelte Components:**
- **All UI components MUST be managed via shadcn-svelte CLI** - do not create custom UI components manually
- Install new components: `bun x shadcn-svelte@latest add <component>`
- Components are installed to `src/lib/components/ui/<component>/` directory structure
- Configuration is managed in `components.json`
- After installing, add exports to `src/lib/components/ui/index.ts`
- Check [shadcn-svelte docs](https://www.shadcn-svelte.com/docs/components) for available components
- When CLI generates `@lucide/svelte` imports, replace them with `~icons/lucide/*`

**Important - Icons:** Always use `unplugin-icons` for Lucide icons, NOT `@lucide/svelte`:
```typescript
// ✅ Correct - use unplugin-icons
import IconSearch from '~icons/lucide/search';
import IconX from '~icons/lucide/x';

// ❌ Wrong - do NOT use @lucide/svelte
import Search from '@lucide/svelte/icons/search';
```

When installing shadcn-svelte components via CLI, replace any `@lucide/svelte` imports with `~icons/lucide/*` format.

## Key Technical Details

### Svelte 5 Runes

The codebase uses Svelte 5 with runes syntax:
- `$state` for reactive state
- `$derived` for computed values
- `$effect` for side effects
- `$props` for component props

### Widget Handler Pattern

Always use `createHandler()` from `src/lib/widgets/utils/create-handler.ts`:

```typescript
export const POST = createHandler({
  varsSchema: widget.varsSchema,
  async fetch(vars, context) {
    // Fetch logic here
    return data;
  },
  cacheTtl: 10000, // Optional custom TTL (ms)
});
```

### Zod Validation

All config files are validated with Zod schemas in `src/lib/config/schema.ts`. Widget vars and data also use Zod schemas defined in their `meta.ts`.

### Adapter

Uses `svelte-adapter-bun` for production builds (not standard Node adapter).

## Environment Variables

- `CONFIG_DIR` - Path to config directory (default: `./config`)

## Docker

Build and run with Docker:
```bash
docker build -t liteda .
docker run -p 3000:3000 -v ./config:/app/config liteda

# Or with docker-compose
docker compose up -d
```

## Development Workflow

**Adding a New Widget:**
1. Copy template: `cp -r src/lib/widgets/_template src/lib/widgets/my-widget`
2. Define schemas and metadata in `meta.ts`
3. Implement server-side fetch logic in `handler.ts` using `createHandler()`
4. Build UI in `Widget.svelte` using `useWidget()` composable
5. No registration needed - auto-discovered on next build

**Adding a New Addon:**
1. Create folder: `src/lib/addons/my-addon/`
2. Define with `defineAddon()` in `meta.ts`
3. Create UI in `Addon.svelte`
4. Configure in `settings.yaml` under `layout.header`

**Modifying Config Schema:**
- Update `src/lib/config/schema.ts` with Zod schemas
- Restart dev server to reload config

## Testing Widget Handlers

Widget handlers expect POST requests with JSON body containing `id`:
```bash
# Test a widget endpoint
curl -X POST http://localhost:5173/api/widgets/demo \
  -H "Content-Type: application/json" \
  -d '{"id":"widget-1"}'
```
