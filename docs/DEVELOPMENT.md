# Development Guide

This guide covers the project structure, architecture, and development workflow for contributing to Liteda.

## Table of Contents

- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Configuration System](#configuration-system)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)

## Project Structure

```
liteda/
├── config/                    # User configuration files
│   ├── settings.yaml         # Global settings
│   ├── services.yaml         # Default home page
│   └── pages/                # Additional pages (YAML/MD)
│
├── src/
│   ├── routes/               # SvelteKit routes
│   │   ├── +layout.svelte   # Root layout
│   │   ├── +page.svelte     # Home page
│   │   └── api/             # API endpoints
│   │       ├── widgets/     # Widget data endpoints
│   │       └── gadgets/     # Gadget data endpoints
│   │
│   ├── lib/
│   │   ├── widgets/         # Widget system
│   │   │   ├── _template/  # Widget template
│   │   │   ├── portainer/
│   │   │   ├── jellyfin/
│   │   │   └── utils/      # Widget utilities
│   │   │
│   │   ├── gadgets/         # Gadget system
│   │   │   ├── resources/
│   │   │   ├── weather/
│   │   │   └── utils/      # Gadget utilities
│   │   │
│   │   ├── features/        # Feature system (lazy-loaded)
│   │   │   ├── _template/
│   │   │   └── loader.ts   # Feature loader
│   │   │
│   │   ├── config/          # Configuration system
│   │   │   ├── loader.ts   # YAML/MD loader
│   │   │   ├── schema.ts   # Zod schemas
│   │   │   └── cache.ts    # Config cache
│   │   │
│   │   ├── components/      # UI components
│   │   │   ├── ui/         # shadcn-svelte components
│   │   │   ├── widget-ui/  # Widget UI helpers
│   │   │   └── gadget-ui/  # Gadget UI helpers
│   │   │
│   │   ├── i18n/           # Internationalization
│   │   │   └── translations/
│   │   │
│   │   └── status-check/   # Service status checking
│   │
│   └── hooks.server.ts      # Server-side hooks
│
├── static/                   # Static assets
├── Dockerfile
├── docker-compose.yml
└── svelte.config.js
```

## Architecture Overview

### Three-Layer System

Liteda uses a three-layer architecture for extensibility:

```
┌─────────────────────────────────────┐
│  Header Bar (Gadgets + Groups)     │  ← Gadgets
├─────────────────────────────────────┤
│  Pages (YAML / Markdown)            │  ← Config
│    └─ Service Groups                │
│         └─ Items (+ Widgets)        │  ← Widgets
└─────────────────────────────────────┘
```

**1. Widgets** - Service monitoring cards
- Location: `src/lib/widgets/`
- Loading: Always loaded (eager import)
- Size: ~10-30 KB each
- Purpose: Display live data from services
- Examples: Portainer, Jellyfin, Proxmox

**2. Gadgets** - Header bar components
- Location: `src/lib/gadgets/`
- Loading: Always loaded (eager import)
- Size: ~10-30 KB each, ~80 KB total
- Purpose: Header UI elements
- Examples: Resources, weather, search, theme-switcher

**3. Features** - Heavy optional modules
- Location: `src/lib/features/`
- Loading: Lazy-loaded when enabled
- Size: ~1-5 MB each
- Purpose: Heavy functionality with large dependencies
- Examples: Docker discovery (future)

### Data Flow

#### Widget Data Flow

```
Client (Widget.svelte)
  ↓ POST /api/widgets/[type]
  ↓ { id: "widget-1" }
  ↓
Server Handler (handler.ts)
  ↓ Look up full config by ID (includes sensitive vars)
  ↓ Check cache (TTL: widget.interval or 10s)
  ↓ Fetch from service API if cache miss
  ↓ Return data (validated by Zod schema)
  ↓
Client
  ↓ Update UI with data
  ↓ Schedule next poll (interval)
```

**Security Model:**
- Client only knows widget ID
- Server stores full config with sensitive vars (API keys, passwords)
- Vars NEVER sent to browser
- Server-side proxy avoids CORS issues

#### Gadget Data Flow

```
Client (Gadget.svelte)
  ↓ GET /api/gadgets/[type]?id=gadget-1
  ↓
Server Handler (handler.ts)
  ↓ Look up full config by ID
  ↓ Check cache (TTL: configurable)
  ↓ Fetch from external API if cache miss
  ↓ Return data
  ↓
Client
  ↓ Update UI
  ↓ Schedule next poll
```

### Caching System

**Unified Cache** (`src/lib/widgets/utils/cache.ts`)

All API endpoints (widgets, gadgets, status checks) use the same cache system:

**Features:**
- **LRU Eviction** - Max 1000 entries, automatically evicts least recently used
- **Lazy Expiration** - Expired entries cleaned on access (optimal performance)
- **Opportunistic Cleanup** - Removes 5 stale items per access
- **Periodic Purge** - Background task cleans all expired entries every 5 minutes
- **Thundering Herd Prevention** - Concurrent requests share same fetch promise
- **Memory Safety** - Bounded cache size prevents unbounded growth

**Default TTL:**
- Widgets: `interval` setting or 10 seconds
- Gadgets: Configurable via `vars.cache` (in minutes)
- Status checks: 10 seconds

**Cache Configuration Example:**
```typescript
// Widget handler
export const POST = createHandler({
  varsSchema: widget.varsSchema,
  async fetch(vars) {
    // Fetch logic
  },
  cacheTtl: 10000, // 10 seconds (or use widget.interval)
});

// Gadget handler
export const GET = createGadgetHandler({
  varsSchema,
  async fetch(vars) {
    // Fetch logic
  },
  cacheTtl: (vars) => vars.cache * 60 * 1000, // Convert minutes to ms
});
```

## Configuration System

### Loading Flow

1. **Server Startup** (`hooks.server.ts` - `init` hook)
   - Load all config files from `config/` directory
   - Parse YAML/Markdown with frontmatter
   - Validate with Zod schemas
   - Extract widgets and status checks
   - Assign unique IDs to widgets/gadgets/status checks
   - Cache in memory

2. **Widget/Gadget Config Storage**
   - Full configs (with sensitive vars) stored server-side
   - Client only receives IDs
   - Server looks up config by ID when handling requests

3. **Config Cache**
   - Config loaded once at startup
   - Cached in `src/lib/config/cache.ts`
   - No re-parsing on each request

### Zod Schemas

All configs validated with Zod (`src/lib/config/schema.ts`):

```typescript
// Settings schema
export const settingsSchema = z.object({
  title: z.string(),
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  background: backgroundSchema.optional(),
  layout: layoutSchema,
  pages: z.array(pageRefSchema),
  features: z.record(featureConfigSchema).optional(),
});

// Service item schema
export const serviceItemSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  icon: z.string().optional(),
  description: z.string().optional(),
  widget: widgetConfigSchema.optional(),
});
```

**Widget/Gadget vars schemas** defined in their `meta.ts`:

```typescript
export default defineWidget({
  name: 'portainer',
  varsSchema: z.object({
    url: z.string().url(),
    key: z.string(),
    env: z.number().default(1),
  }),
});
```

## Development Workflow

### Setup

```bash
# Install dependencies
bun install

# Start dev server
bun dev
```

**Note:** JSON schemas are automatically generated during `bun run build`. For development, you can manually generate them with `bun run schema` if needed for IDE autocomplete.

### Hot Module Replacement (HMR)

SvelteKit provides HMR for:
- Svelte components
- TypeScript/JavaScript modules
- CSS/Tailwind styles

Config changes require server restart:
```bash
# Ctrl+C and restart
bun dev
```

### Type Checking

```bash
# Run TypeScript type checking
bun run check

# Watch mode
bun run check:watch
```

### Building

```bash
# Production build (automatically generates schemas first)
bun run build

# Preview production build
bun preview
```

**Note:** `bun run build` automatically runs `bun run schema` before building to ensure schemas are up-to-date.

## Code Style

### Svelte 5 Runes

Use Svelte 5 runes syntax:

```typescript
// State
let count = $state(0);

// Derived state
let doubled = $derived(count * 2);

// Effects
$effect(() => {
  console.log('Count changed:', count);
});

// Props
interface Props {
  config: WidgetConfig;
}
let { config }: Props = $props();
```

### Component Props

Always use TypeScript interfaces for props:

```svelte
<script lang="ts">
  import type { WidgetProps } from '../types';

  interface Props extends WidgetProps<MyWidgetConfig> {
    // Additional props if needed
  }

  let { config, id }: Props = $props();
</script>
```

### Imports

Use path aliases from `svelte.config.js`:

```typescript
import { Button } from '$lib/components/ui/button';
import { useWidget } from '$lib/widgets/utils';
import { loadConfig } from '$lib/config/loader';
```

**Icon Imports** - Always use `unplugin-icons`:

```typescript
// ✅ Correct
import IconSearch from '~icons/lucide/search';
import IconX from '~icons/lucide/x';

// ❌ Wrong - do NOT use @lucide/svelte
import Search from '@lucide/svelte/icons/search';
```

### shadcn-svelte Components

**IMPORTANT:** All UI components MUST be managed via shadcn-svelte CLI.

```bash
# Install a new component
bun x shadcn-svelte@latest add button

# Install multiple components
bun x shadcn-svelte@latest add button card dialog
```

After installing, add exports to `src/lib/components/ui/index.ts`:

```typescript
export { Button } from './button';
export { Card } from './card';
```

**Replace Lucide imports** when CLI generates them:

```typescript
// CLI generated (❌ wrong)
import Search from '@lucide/svelte/icons/search';

// Replace with (✅ correct)
import IconSearch from '~icons/lucide/search';
```

### Formatting

Use Prettier (configured in `.prettierrc`):

```bash
# Format all files
bun x prettier --write .

# Check formatting
bun x prettier --check .
```

## Testing

### Manual Testing

1. **Widget Testing**
```bash
# Start dev server
bun dev

# Test widget endpoint
curl -X POST http://localhost:5173/api/widgets/portainer \
  -H "Content-Type: application/json" \
  -d '{"id":"widget-1"}'
```

2. **Gadget Testing**
```bash
# Test gadget endpoint
curl "http://localhost:5173/api/gadgets/weather?id=gadget-1"
```

3. **Config Validation**
```bash
# Generate schemas
bun run schema

# Check YAML files in VS Code - errors will be highlighted
```

### Integration Testing

Test with real services:

1. Update `config/services.yaml` with test service
2. Add widget config with real API credentials
3. Start dev server and verify widget displays data
4. Check browser console for errors

### Docker Testing

```bash
# Build image
docker build -t liteda:test .

# Run container
docker run -p 3000:3000 -v ./config:/app/config liteda:test

# Test in browser
open http://localhost:3000
```

## Performance Considerations

### Memory Optimization

- **Widget/Gadget Size** - Keep components lightweight (<30 KB)
- **Eager Loading** - Only widgets and gadgets are always loaded
- **Lazy Loading** - Use features for heavy dependencies (>1 MB)
- **Cache Bounds** - LRU eviction at 1000 entries prevents unbounded growth

### Caching Strategy

- **Default TTL** - 10 seconds balances freshness and API load
- **Shared Cache** - Multiple clients share same cached data
- **Thundering Herd** - Concurrent requests wait for same promise
- **Periodic Cleanup** - Background purge every 5 minutes

### Build Optimization

- **Code Splitting** - SvelteKit automatically splits routes
- **Tree Shaking** - Unused exports are removed
- **Minification** - Production builds are minified
- **Adapter** - `svelte-adapter-bun` for optimal Bun performance

## Path Aliases

Configured in `svelte.config.js`:

```typescript
alias: {
  $lib: './src/lib',
  $components: './src/lib/components',
  $widgets: './src/lib/widgets',
  $gadgets: './src/lib/gadgets',
  $config: './src/lib/config',
}
```

## Environment Variables

- `CONFIG_DIR` - Path to config directory (default: `./config`)

Set in `.env`:
```bash
CONFIG_DIR=/path/to/config
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

See specific development guides:
- [Widget Development](WIDGETS.md)
- [Gadget Development](GADGETS.md)
