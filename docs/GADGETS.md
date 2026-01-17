# Gadget Development Guide

Gadgets are lightweight header bar components that provide quick access to information and controls. This guide covers creating custom gadgets for Liteda.

## Table of Contents

- [Gadget Architecture](#gadget-architecture)
- [Quick Start](#quick-start)
- [File Structure](#file-structure)
- [Gadget UI Components](#gadget-ui-components)
- [API Handlers](#api-handlers)
- [Group Gadget](#group-gadget)
- [Advanced Topics](#advanced-topics)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Gadget Architecture

### Overview

Gadgets are header bar components that:
- Always loaded (eager import) - ~10-30 KB each
- Auto-discovered via Vite glob
- Optionally fetch data from server APIs
- Support flexible layouts with group gadget

### Basic Structure

```
src/lib/gadgets/my-gadget/
├── meta.ts        # Gadget definition
├── Gadget.svelte  # UI component
├── types.ts       # (Optional) TypeScript types + Zod schemas
├── utils.ts       # (Optional) Helper functions
└── handler.ts     # (Optional) Server-side API handler
```

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ Client (Gadget.svelte)                                  │
│  - Renders in header bar                                │
│  - If needs data: polls GET /api/gadgets/[type]?id=... │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP GET (optional)
                     ↓
┌─────────────────────────────────────────────────────────┐
│ Server (handler.ts) - Optional                          │
│  - Receives gadget ID in query parameter                │
│  - Looks up full config (including sensitive vars)      │
│  - Checks cache (TTL: configurable)                     │
│  - Fetches from external API if needed                  │
│  - Returns data to client                               │
└────────────────────┬────────────────────────────────────┘
                     │ JSON Response
                     ↓
┌─────────────────────────────────────────────────────────┐
│ Client                                                  │
│  - Updates reactive state                               │
│  - Renders UI with new data                             │
│  - Schedules next poll                                  │
└─────────────────────────────────────────────────────────┘
```

**Security Model:**
- Client only knows gadget `id`
- Server stores full config with sensitive `vars`
- Vars NEVER sent to browser

### Auto-Discovery

Gadgets are auto-discovered via `src/lib/gadgets/registry.ts`:

```typescript
const gadgetModules = import.meta.glob<{ default: GadgetDefinition }>(
  './**/meta.ts',
  { eager: true }
);
```

**No manual registration needed!** Just create the folder with `meta.ts`.

## Quick Start

### Simple Gadget (No API)

**1. Create folder and meta.ts:**

```typescript
// src/lib/gadgets/my-gadget/meta.ts
import { defineGadget } from '../utils';
import Gadget from './Gadget.svelte';

export default defineGadget({
  name: 'my-gadget',
  component: Gadget,
  description: 'My custom gadget',
});
```

**2. Create Gadget.svelte:**

```svelte
<!-- src/lib/gadgets/my-gadget/Gadget.svelte -->
<script lang="ts">
  import type { GadgetProps } from '../types';

  interface Props extends GadgetProps<{}> {}
  let { config, id }: Props = $props();
</script>

<div class="text-sm">
  Hello from gadget!
</div>
```

**3. Use in settings.yaml:**

```yaml
layout:
  header:
    - type: my-gadget
```

### Gadget with API

**1. Create types.ts:**

```typescript
// src/lib/gadgets/my-gadget/types.ts
import { z } from 'zod';

// Config vars (server-side only)
export const myGadgetVarsSchema = z.object({
  apiKey: z.string(),
  endpoint: z.string().url(),
  refresh: z.number().default(60000), // ms
  cache: z.number().default(5), // minutes
});

export type MyGadgetVars = z.infer<typeof myGadgetVarsSchema>;

// Data returned from API handler
export interface MyGadgetData {
  value: number;
  label: string;
  updatedAt: string;
}

// Config type for component props
export interface MyGadgetConfig {
  type: 'my-gadget';
  vars: MyGadgetVars;
}
```

**2. Create handler.ts:**

```typescript
// src/lib/gadgets/my-gadget/handler.ts
import { createGadgetHandler } from '$lib/gadgets/utils/create-handler';
import { myGadgetVarsSchema, type MyGadgetData } from './types';

export const GET = createGadgetHandler({
  varsSchema: myGadgetVarsSchema,

  async fetch(vars) {
    // Fetch from external API (vars.apiKey only available server-side)
    const response = await fetch(vars.endpoint, {
      headers: { Authorization: `Bearer ${vars.apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      value: data.count,
      label: data.label,
      updatedAt: new Date().toISOString(),
    } satisfies MyGadgetData;
  },

  // Cache TTL (convert minutes to milliseconds)
  cacheTtl: (vars) => vars.cache * 60 * 1000,

  // Custom cache key
  getCacheKey: (vars) => `my-gadget:${vars.endpoint}`,
});
```

**3. Create Gadget.svelte:**

```svelte
<!-- src/lib/gadgets/my-gadget/Gadget.svelte -->
<script lang="ts">
  import { browser } from '$app/environment';
  import type { GadgetProps } from '../types';
  import type { MyGadgetConfig, MyGadgetData } from './types';
  import { GadgetItem, GadgetMetric, GadgetState } from '$lib/components/gadget-ui';
  import IconActivity from '~icons/lucide/activity';

  interface Props extends GadgetProps<MyGadgetConfig> {}
  let { config, id }: Props = $props();

  // Extract vars with defaults
  const vars = $derived(config.vars);
  const refresh = $derived(vars.refresh || 60000);

  // State
  let data = $state<MyGadgetData | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Fetch data from API
  async function fetchData() {
    try {
      // SECURITY: Only pass gadget ID - server looks up vars
      const res = await fetch(`/api/gadgets/my-gadget?id=${encodeURIComponent(id)}`);

      if (!res.ok) throw new Error('Failed to fetch');

      data = await res.json();
      error = null;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }

  // Auto-fetch with interval
  $effect(() => {
    if (!browser) return;

    fetchData();
    const interval = setInterval(fetchData, refresh);
    return () => clearInterval(interval);
  });
</script>

<!-- Loading/error state -->
<GadgetState {loading} {error} />

<!-- Data state -->
{#if data}
  <GadgetItem icon={IconActivity}>
    <GadgetMetric
      value={data.value}
      label={data.label}
    />
  </GadgetItem>
{/if}
```

**4. Register API route:**

Create `src/routes/api/gadgets/my-gadget/+server.ts`:

```typescript
export { GET } from '$lib/gadgets/my-gadget/handler';
```

**5. Use in settings.yaml:**

```yaml
layout:
  header:
    - type: my-gadget
      vars:
        apiKey: "your-secret-key"
        endpoint: "https://api.example.com"
        refresh: 30000  # 30 seconds
        cache: 5  # 5 minutes
```

## File Structure

### meta.ts - Gadget Definition

**Purpose:** Register gadget with minimal metadata.

```typescript
import { defineGadget } from '../utils';
import Gadget from './Gadget.svelte';

export default defineGadget({
  name: 'my-gadget',     // Must match folder name
  component: Gadget,      // Svelte component
  description: 'Description for users',
});
```

### types.ts - TypeScript Types (Optional)

**Purpose:** Define Zod schemas and TypeScript types.

```typescript
import { z } from 'zod';

// Vars schema (server-side config)
export const myGadgetVarsSchema = z.object({
  apiKey: z.string(),
  endpoint: z.string().url(),
  refresh: z.number().default(60000),
  cache: z.number().default(5),
});

export type MyGadgetVars = z.infer<typeof myGadgetVarsSchema>;

// Data interface (API response)
export interface MyGadgetData {
  value: number;
  label: string;
}

// Config interface (for component props)
export interface MyGadgetConfig {
  type: 'my-gadget';
  vars: MyGadgetVars;
}
```

### handler.ts - API Handler (Optional)

**Purpose:** Server-side data fetching with caching.

```typescript
import { createGadgetHandler } from '$lib/gadgets/utils/create-handler';
import { myGadgetVarsSchema } from './types';

export const GET = createGadgetHandler({
  varsSchema: myGadgetVarsSchema,

  async fetch(vars) {
    // Fetch and return data
    const response = await fetch(vars.endpoint);
    return response.json();
  },

  cacheTtl: (vars) => vars.cache * 60 * 1000,
  getCacheKey: (vars) => `my-gadget:${vars.endpoint}`,
});
```

### Gadget.svelte - UI Component

**Purpose:** Render gadget in header bar.

**Key Patterns:**
- Use `$effect()` for client-side polling
- Check `browser` before fetching
- Use gadget-ui components for consistency
- Handle loading and error states

```svelte
<script lang="ts">
  import { browser } from '$app/environment';
  import type { GadgetProps } from '../types';
  import { GadgetState, GadgetItem, GadgetMetric } from '$lib/components/gadget-ui';

  interface Props extends GadgetProps<MyGadgetConfig> {}
  let { config, id }: Props = $props();

  let data = $state(null);
  let loading = $state(true);
  let error = $state(null);

  async function fetchData() {
    // Fetch implementation
  }

  $effect(() => {
    if (!browser) return;
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  });
</script>

<GadgetState {loading} {error} />
{#if data}
  <!-- Render data -->
{/if}
```

## Gadget UI Components

Located in `src/lib/components/gadget-ui/`, these provide consistent styling.

### GadgetItem

Container for icon + content.

```svelte
<GadgetItem icon={IconCpu}>
  <GadgetMetric value="50%" label="CPU" />
</GadgetItem>

<!-- Custom icon color -->
<GadgetItem icon={IconThermometer} iconClass="text-destructive">
  <GadgetMetric value="90°C" label="TEMP" />
</GadgetItem>
```

**Props:**
- `icon: typeof IconCpu` - Lucide icon component
- `iconClass?: string` - Icon color class (default: `text-muted-foreground`)

### GadgetMetric

Display value with label and optional secondary text.

```svelte
<GadgetMetric value="50%" label="CPU" />

<GadgetMetric
  value="8 GB"
  label="Used"
  secondary="16 GB Total"
/>

<!-- Highlight (red text) -->
<GadgetMetric
  value="90°C"
  label="TEMP"
  highlight={true}
/>
```

**Props:**
- `value: string | number` - Main value
- `label: string` - Label text
- `secondary?: string` - Optional secondary text
- `highlight?: boolean` - Highlight in red (default: `false`)

### GadgetProgress

Progress bar (0-100%).

```svelte
<GadgetProgress value={75} />

<!-- With highlight (red bar) -->
<GadgetProgress value={90} highlight={true} />
```

**Props:**
- `value: number` - Progress value (0-100)
- `highlight?: boolean` - Red bar if true (default: `false`)

### GadgetState

Loading and error state display.

```svelte
<GadgetState loading={true} error={null} />
<GadgetState loading={false} error="Failed to fetch" />
```

**Props:**
- `loading: boolean` - Show loading spinner
- `error: string | null` - Error message (if any)

**Behavior:**
- Shows spinner when `loading && !error`
- Shows error message when `error` is set
- Hidden when `!loading && !error`

### GadgetButton

Clickable button with icon.

```svelte
<script>
  import { GadgetButton } from '$lib/components/gadget-ui';
  import IconSettings from '~icons/lucide/settings';

  function handleClick() {
    console.log('Clicked!');
  }
</script>

<GadgetButton icon={IconSettings} onclick={handleClick} />
```

**Props:**
- `icon: typeof IconSettings` - Lucide icon
- `onclick?: () => void` - Click handler

## API Handlers

### createGadgetHandler()

Utility for creating gadget API handlers with caching.

**Basic Usage:**

```typescript
export const GET = createGadgetHandler({
  varsSchema: myGadgetVarsSchema,

  async fetch(vars) {
    const response = await fetch(vars.endpoint);
    return response.json();
  },
});
```

**With Custom Cache:**

```typescript
export const GET = createGadgetHandler({
  varsSchema: myGadgetVarsSchema,

  async fetch(vars) {
    return fetchData(vars);
  },

  // Cache TTL (milliseconds)
  cacheTtl: (vars) => vars.cache * 60 * 1000,

  // Custom cache key
  getCacheKey: (vars) => `gadget:${vars.latitude},${vars.longitude}`,
});
```

**Parameters:**
- `varsSchema: ZodSchema` - Zod schema for vars validation
- `fetch: (vars) => Promise<Data>` - Data fetching function
- `cacheTtl?: number | (vars) => number` - Cache TTL in ms (optional)
- `getCacheKey?: (vars) => string` - Cache key generator (optional)

**Default Behavior:**
- Cache TTL: 5 minutes (300000 ms)
- Cache key: `gadget-type:gadget-id`
- Unified cache (shared with widgets)
- Thundering herd prevention

## Group Gadget

Group gadget organizes other gadgets with flexible alignment.

### Basic Usage

```yaml
layout:
  header:
    # Left-aligned group
    - type: group
      vars:
        align: left
        items:
          - type: resources
          - type: weather

    # Center spacer
    - type: spacer

    # Right-aligned group
    - type: group
      vars:
        align: right
        items:
          - type: search
          - type: theme-switcher
```

### Alignment Options

```yaml
# Left alignment
- type: group
  vars:
    align: left  # Items pushed to the left
    items: [...]

# Center alignment
- type: group
  vars:
    align: center  # Items centered
    items: [...]

# Right alignment
- type: group
  vars:
    align: right  # Items pushed to the right
    items: [...]
```

### Nested Groups

```yaml
layout:
  header:
    - type: group
      vars:
        align: left
        items:
          # Nested group
          - type: group
            vars:
              align: center
              items:
                - type: resources
                - type: weather
```

### Responsive Design

Groups automatically handle responsive layout:
- Desktop: All items visible
- Mobile: Items may stack or wrap based on gadget design

## Advanced Topics

### Client-Side Polling

Use `$effect()` for auto-refresh:

```typescript
$effect(() => {
  if (!browser) return;

  // Initial fetch
  fetchData();

  // Poll every N ms
  const interval = setInterval(fetchData, refreshInterval);

  // Cleanup on unmount
  return () => clearInterval(interval);
});
```

**Important:**
- Always check `browser` before fetching
- Return cleanup function to clear interval
- Don't destructure reactive values in effect

### Conditional Display

Show/hide gadget parts based on state:

```svelte
<script>
  const vars = $derived(config.vars);
  const showCpu = $derived(vars.cpu !== false);
  const showMemory = $derived(vars.memory !== false);
</script>

{#if showCpu && data.cpu}
  <GadgetItem icon={IconCpu}>
    <GadgetMetric value={`${data.cpu.usage}%`} label="CPU" />
  </GadgetItem>
{/if}

{#if showMemory && data.memory}
  <GadgetItem icon={IconMemoryStick}>
    <GadgetMetric value={formatBytes(data.memory.used)} label="Used" />
  </GadgetItem>
{/if}
```

### Interactive Gadgets

Use popovers or modals for detailed views:

```svelte
<script>
  import * as Popover from '$components/ui/popover';
  let popoverOpen = $state(false);
</script>

<Popover.Root bind:open={popoverOpen}>
  <Popover.Trigger>
    <!-- Compact display -->
    <GadgetItem icon={IconCloud}>
      <GadgetMetric value={formatTemp(data.temp)} label={data.label} />
    </GadgetItem>
  </Popover.Trigger>

  <Popover.Content>
    <!-- Detailed view -->
    <div class="space-y-2">
      <Row label="Temperature" value={formatTemp(data.temp)} />
      <Row label="Feels Like" value={formatTemp(data.feelsLike)} />
      <Row label="Humidity" value={`${data.humidity}%`} />
    </div>
  </Popover.Content>
</Popover.Root>
```

See `src/lib/gadgets/weather/Gadget.svelte` for complete example.

## Best Practices

### Security

1. **Never expose sensitive data to client**

```typescript
// ✅ Good - API key in varsSchema (server-side)
varsSchema: z.object({
  apiKey: z.string(),
})

// ❌ Bad - API key in client
// DON'T send API keys to browser
```

2. **Only send gadget ID to API**

```typescript
// ✅ Good
const res = await fetch(`/api/gadgets/my-gadget?id=${encodeURIComponent(id)}`);

// ❌ Bad - exposes sensitive vars
const res = await fetch(`/api/gadgets/my-gadget?apiKey=${config.vars.apiKey}`);
```

### Performance

1. **Keep gadgets lightweight**
- Target <30 KB per gadget
- Avoid heavy dependencies
- Use dynamic imports for large libraries

2. **Appropriate polling intervals**

```typescript
// Fast updates (system stats)
refresh: 5000, // 5 seconds

// Moderate updates (weather)
refresh: 600000, // 10 minutes

// Slow updates (news)
refresh: 3600000, // 1 hour
```

3. **Efficient caching**

```typescript
// Share cache across similar gadgets
getCacheKey: (vars) => `weather:${vars.latitude},${vars.longitude}`,

// Multiple gadgets at same location share cache
```

### UX

1. **Handle all states**

```svelte
<!-- Loading -->
{#if loading && !data}
  <GadgetState loading={true} error={null} />
{/if}

<!-- Error -->
{#if error}
  <GadgetState loading={false} error={error} />
{/if}

<!-- Data -->
{#if data}
  <!-- Render gadget -->
{/if}
```

2. **Responsive design**

```svelte
<!-- Hide labels on mobile -->
<span class="hidden sm:inline">{label}</span>

<!-- Smaller icons on mobile -->
<IconCpu class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
```

3. **Meaningful labels**

```svelte
<!-- ✅ Good -->
<GadgetMetric value="75%" label="CPU" secondary="4 cores" />

<!-- ❌ Bad -->
<GadgetMetric value="75" /> <!-- No label -->
```

## Examples

### Simple Display Gadget

```typescript
// meta.ts
export default defineGadget({
  name: 'clock',
  component: Gadget,
  description: 'Display current time',
});
```

```svelte
<!-- Gadget.svelte -->
<script lang="ts">
  import { browser } from '$app/environment';

  let time = $state(new Date().toLocaleTimeString());

  $effect(() => {
    if (!browser) return;
    const interval = setInterval(() => {
      time = new Date().toLocaleTimeString();
    }, 1000);
    return () => clearInterval(interval);
  });
</script>

<div class="text-sm font-mono">{time}</div>
```

### System Monitor Gadget

See complete example: `src/lib/gadgets/resources/`

**Key Features:**
- Multiple metrics (CPU, memory, disk, temp)
- Conditional display based on vars
- Progress bars for visual feedback
- Configurable units and thresholds

### Weather Gadget

See complete example: `src/lib/gadgets/weather/`

**Key Features:**
- External API integration (Open-Meteo)
- Popover for detailed view
- Icon mapping based on weather code
- Unit conversion (metric/imperial)
- Relative time display

## Troubleshooting

### Gadget not appearing in header

1. Check `meta.ts` exists and exports gadget definition
2. Verify gadget is configured in `settings.yaml`
3. Restart dev server
4. Check browser console for errors

### Data not updating

1. Verify `browser` check before fetching
2. Check API endpoint is registered in `src/routes/api/gadgets/`
3. Test endpoint manually:
   ```bash
   curl "http://localhost:5173/api/gadgets/my-gadget?id=gadget-1"
   ```
4. Check browser console for fetch errors

### TypeScript errors

1. Ensure types are properly exported from `types.ts`
2. Run `bun run check` for type checking
3. Check Zod schema matches data structure

### Styling issues

1. Use Tailwind classes (avoid custom CSS)
2. Use gadget-ui components for consistency
3. Test responsive design at different screen sizes
4. Check for conflicting classes

## Related Documentation

- [Development Guide](DEVELOPMENT.md) - Project architecture
- [Widget Development](WIDGETS.md) - Service monitoring widgets
