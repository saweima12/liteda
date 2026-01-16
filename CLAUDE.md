# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Liteda is a lightweight homelab dashboard built with SvelteKit. It provides a configurable interface for managing services, widgets, and markdown content. The app is designed to be memory-efficient (~50-100MB) with a focus on SSR proxy capabilities to avoid CORS issues.

**Memory Usage Notes:**
- Baseline memory: ~50-80MB
- Memory can fluctuate to ~100MB during active polling due to HTTP connection pools and V8/Bun GC behavior
- Cache system has LRU eviction (max 1000 entries) to prevent unbounded growth
- Memory stays within acceptable bounds during long-running sessions

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
├── types.ts     # TypeScript types + Zod schemas (optional)
├── utils.ts     # Helper functions (optional)
└── Addon.svelte # UI component
```

Auto-scanned via `src/lib/addons/registry.ts`. Configured in `settings.yaml` under `layout.header`.

**Built-in Addons:**
- `title` - Display site title from settings
- `spacer` - Flexible spacer (use `flex-1` to push items to the right)
- `theme-switcher` - Toggle between light/dark theme
- `search` - Global search with keyboard shortcuts (Cmd+K / Ctrl+K)
- `resources` - System resources monitor (CPU, memory, disk, temperature)
- `weather` - Current weather from Open-Meteo API with clickable popover for details

**Weather Addon Example:**
```yaml
layout:
  header:
    - type: resources      # Left side
    - type: spacer         # Push to right
    - type: weather        # Right side
      vars:
        latitude: 25.0330
        longitude: 121.5654
        label: "Taipei"
        units: metric      # or imperial
        refresh: 600000    # 10 minutes
        cache: 5           # 5 minutes server cache
    - type: search
    - type: theme-switcher
```

**Addon Patterns:**
- Addons with API calls use the unified handler pattern (similar to widgets)
- API route: GET `/api/addons/[type]?id=<addon-id>` - only addon ID is passed from client
- **Security Model:** Sensitive vars (API keys, passwords) are NEVER sent to client - server looks up full config by ID
- Client-side polling using `$effect` with cleanup
- Use `browser` check before fetching data
- Support configurable refresh intervals via `vars`
- Server-side handlers use `createAddonHandler()` utility with Zod validation and caching

### Server-Side Rendering & Caching

- **SSR Proxy:** Widget handlers run server-side to avoid CORS issues
- **Config Cache:** Config is loaded once at startup (`hooks.server.ts`) and cached in memory
- **Widget Data Cache:** `src/lib/widgets/utils/cache.ts` provides production-grade caching:
  - **LRU Eviction:** Max 1000 entries, automatically evicts least recently used items
  - **Lazy Expiration:** Expired entries cleaned on access for optimal performance
  - **Opportunistic Cleanup:** Gradually removes stale data (5 items per access)
  - **Periodic Purge:** Background task cleans all expired entries every 5 minutes
  - **Thundering Herd Prevention:** Concurrent requests share the same fetch promise
  - **Memory Safety:** Bounded cache size prevents unbounded memory growth
- **Status Checks:** Similar polling system for service availability in `src/lib/status-check/`

**Cache Configuration:**
- Default TTL: 5 seconds (or widget's `interval` setting)
- Max cache size: 1000 entries
- Purge interval: 5 minutes
- All API endpoints (widgets, weather, status checks) use the unified cache system

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
3. (Optional) Create `types.ts` if addon needs Zod schemas
4. (Optional) Create `utils.ts` for helper functions
5. (Optional) Create API route if addon needs server-side data fetching
6. Create UI in `Addon.svelte`
7. Configure in `settings.yaml` under `layout.header`

**Addon with API Example (Weather):**
```
src/lib/addons/weather/
├── types.ts           # Zod schemas, constants, TypeScript types
├── utils.ts           # Helper functions (formatting, mapping)
├── handler.ts         # GET handler with createAddonHandler()
├── Addon.svelte       # UI component with client-side polling
└── meta.ts            # Addon registration
```

**Creating an Addon Handler:**
```typescript
// src/lib/addons/my-addon/handler.ts
import { createAddonHandler } from '$lib/addons/utils/create-handler';
import { z } from 'zod';

const varsSchema = z.object({
  apiKey: z.string(),
  endpoint: z.string(),
  cache: z.number().default(5), // minutes
});

export const GET = createAddonHandler({
  varsSchema,
  async fetch(vars) {
    // Sensitive vars (apiKey) are ONLY available server-side
    const res = await fetch(vars.endpoint, {
      headers: { 'Authorization': `Bearer ${vars.apiKey}` }
    });
    return res.json();
  },
  cacheTtl: (vars) => vars.cache * 60 * 1000,
  getCacheKey: (vars) => `my-addon:${vars.endpoint}`,
});
```

**Calling Addon API from Svelte:**
```typescript
// Addon.svelte
interface Props extends AddonProps<MyAddonConfig> {}
let { config, id }: Props = $props();

async function fetchData() {
  // SECURITY: Only pass addon ID - server looks up vars with apiKey
  const res = await fetch(`/api/addons/my-addon?id=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}
```

**Modifying Config Schema:**
- Update `src/lib/config/schema.ts` with Zod schemas
- Restart dev server to reload config

## Testing Handlers

**Widget Handlers** expect POST requests with JSON body containing `id`:
```bash
# Test a widget endpoint
curl -X POST http://localhost:5173/api/widgets/demo \
  -H "Content-Type: application/json" \
  -d '{"id":"widget-1"}'
```

**Addon Handlers** expect GET requests with query parameter `id`:
```bash
# Test an addon endpoint
curl "http://localhost:5173/api/addons/weather?id=addon-1"

# Test resources addon
curl "http://localhost:5173/api/addons/resources?id=addon-1"
```
