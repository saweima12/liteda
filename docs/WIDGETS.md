# Widget Development Guide

Widgets are auto-discovered components that display live data from your homelab services. This guide covers everything you need to create custom widgets.

## Table of Contents

- [Widget Architecture](#widget-architecture)
- [Quick Start](#quick-start)
- [File Structure](#file-structure)
- [Step-by-Step Guide](#step-by-step-guide)
- [Widget UI Components](#widget-ui-components)
- [Advanced Topics](#advanced-topics)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Widget Architecture

### Three-File Structure

Every widget consists of three files:

```
src/lib/widgets/my-widget/
├── meta.ts       # Widget definition + Zod schemas
├── handler.ts    # Server-side data fetching (POST /api/widgets/my-widget)
└── Widget.svelte # UI component (client-side)
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Client (Widget.svelte)                                          │
│  - Calls useWidget() composable                                 │
│  - Polls /api/widgets/[type] every {interval}ms                 │
│  - Sends POST with { id: "widget-1" }                           │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP POST
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ Server (handler.ts)                                             │
│  - Receives widget ID                                           │
│  - Looks up full config (including sensitive vars)              │
│  - Checks cache (TTL: widget.interval or 10s)                   │
│  - If cache miss: fetch from service API                        │
│  - Validates response with dataSchema                           │
│  - Returns data to client                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │ JSON Response
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ Client                                                          │
│  - Updates reactive state                                       │
│  - Renders UI with new data                                     │
│  - Schedules next poll                                          │
└─────────────────────────────────────────────────────────────────┘
```

**Security Model:**
- Client only knows widget `id`
- Server stores full config with sensitive `vars` (API keys, passwords)
- `vars` are NEVER sent to browser
- Server-side proxy avoids CORS issues

### Auto-Discovery

Widgets are automatically discovered via Vite glob import in `src/lib/widgets/registry.ts`:

```typescript
const widgetModules = import.meta.glob<{ default: WidgetDefinition }>(
  './**/meta.ts',
  { eager: true }
);
```

**No manual registration needed!** Just create the folder structure and it will be detected.

## Quick Start

### 1. Copy Template

```bash
cp -r src/lib/widgets/_template src/lib/widgets/my-widget
```

### 2. Update meta.ts

```typescript
import { z } from 'zod';
import { defineWidget } from '../utils/define';
import Widget from './Widget.svelte';

const widget = defineWidget({
  name: 'my-widget',
  component: Widget,
  description: 'Display data from My Service',
  icon: 'activity', // Lucide icon name

  // Server-to-client data structure
  dataSchema: z.object({
    status: z.enum(['online', 'offline']),
    activeUsers: z.number(),
    totalRequests: z.number(),
  }),

  // Server-side configuration (never sent to client)
  varsSchema: z.object({
    url: z.string().url(),
    apiKey: z.string(),
  }),
});

export default widget;
export type WidgetData = z.infer<typeof widget.dataSchema>;
export type WidgetVars = z.infer<typeof widget.varsSchema>;
```

### 3. Implement handler.ts

```typescript
import { createHandler } from '../utils/create-handler';
import widget from './meta';

export const POST = createHandler({
  varsSchema: widget.varsSchema,

  async fetch(vars) {
    // Fetch from service API (vars.apiKey is only available server-side)
    const response = await fetch(`${vars.url}/api/stats`, {
      headers: { Authorization: `Bearer ${vars.apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Return data matching dataSchema
    return {
      status: data.online ? 'online' : 'offline',
      activeUsers: data.users,
      totalRequests: data.requests,
    };
  },
});
```

### 4. Build UI in Widget.svelte

```svelte
<script lang="ts">
  import type { ClientWidgetConfig } from '../types';
  import widgetDef from './meta';
  import { useWidget } from '../utils';
  import { Block, Row, Status, Metric } from '$components/widget-ui';
  import { Skeleton } from '$components/ui';
  import IconAlertCircle from '~icons/lucide/alert-circle';

  interface Props {
    config: ClientWidgetConfig;
  }

  let { config }: Props = $props();

  // DON'T destructure - breaks reactivity
  const widget = useWidget(widgetDef, () => config);
</script>

<Block>
  {#if widget.loading && !widget.data}
    <!-- Loading skeleton -->
    <Skeleton class="h-8 w-full" />
  {:else if widget.error}
    <!-- Error state -->
    <div class="flex items-center gap-2 text-destructive text-sm">
      <IconAlertCircle class="h-4 w-4" />
      <span>{widget.error}</span>
    </div>
  {:else if widget.data}
    <!-- Normal state -->
    <Status status={widget.data.status === 'online' ? 'healthy' : 'error'} />

    <Block layout="grid" columns={2}>
      <Metric label="Active Users" value={widget.data.activeUsers} />
      <Metric label="Total Requests" value={widget.data.totalRequests} />
    </Block>
  {/if}
</Block>
```

### 5. Use in Config

```yaml
# config/services.yaml
- name: Services
  items:
    - name: My Service
      icon: my-service
      url: https://my-service.local
      widget:
        type: my-widget
        interval: 10000  # Poll every 10s
        vars:
          url: https://my-service.local/api
          apiKey: "your-secret-api-key"
```

## File Structure

### meta.ts - Widget Definition

**Purpose:** Define widget metadata, data schema, and vars schema.

**Key Exports:**
- `default` - Widget definition (created with `defineWidget()`)
- `WidgetData` - TypeScript type for widget data
- `WidgetVars` - TypeScript type for widget vars (optional)

**Example:**
```typescript
import { z } from 'zod';
import { defineWidget } from '../utils/define';
import Widget from './Widget.svelte';

const widget = defineWidget({
  // Widget identifier (must match folder name)
  name: 'portainer',

  // Svelte component
  component: Widget,

  // User-facing description
  description: 'Portainer container stats',

  // Lucide icon name
  icon: 'box',

  // Data schema (server → client)
  dataSchema: z.object({
    runningContainers: z.number(),
    stoppedContainers: z.number(),
    totalContainers: z.number(),
  }),

  // Vars schema (config → server only)
  varsSchema: z.object({
    url: z.string().url(),
    key: z.string(),
    env: z.number().default(1),
  }),
});

export default widget;
export type WidgetData = z.infer<typeof widget.dataSchema>;
export type WidgetVars = z.infer<typeof widget.varsSchema>;
```

**Schema Guidelines:**
- Use `.default()` for optional fields with defaults
- Use `.optional()` for truly optional fields
- Keep `dataSchema` focused on what UI needs
- Put sensitive data (keys, passwords) in `varsSchema`

### handler.ts - Server-Side Handler

**Purpose:** Fetch data from service API, validate, and return to client.

**Key Features:**
- Server-side only (runs in SvelteKit API route)
- Access to sensitive `vars` (API keys, passwords)
- Automatic caching with TTL
- Zod validation of input and output
- Error handling

**Example:**
```typescript
import { createHandler } from '../utils/create-handler';
import widget from './meta';
import type { WidgetVars } from './meta';

export const POST = createHandler({
  varsSchema: widget.varsSchema,

  async fetch(vars: WidgetVars) {
    // 1. Fetch from service API
    const response = await fetch(`${vars.url}/api/${vars.env}/status`, {
      headers: {
        'X-API-Key': vars.key,
      },
    });

    // 2. Handle errors
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // 3. Parse response
    const data = await response.json();

    // 4. Return data matching dataSchema
    return {
      runningContainers: data.running,
      stoppedContainers: data.stopped,
      totalContainers: data.total,
    };
  },

  // Optional: Custom cache TTL (default: widget.interval or 10s)
  cacheTtl: 15000, // 15 seconds
});
```

**Error Handling:**
- Throw errors for API failures
- Client receives error in `widget.error`
- Errors are NOT cached

**Custom TTL:**
```typescript
export const POST = createHandler({
  varsSchema: widget.varsSchema,
  async fetch(vars) { /* ... */ },

  // Option 1: Fixed TTL
  cacheTtl: 30000, // 30 seconds

  // Option 2: Dynamic TTL based on vars
  cacheTtl: (vars) => vars.refreshInterval * 1000,
});
```

### Widget.svelte - UI Component

**Purpose:** Render widget data with loading and error states.

**Key Patterns:**
- Use `useWidget()` composable for state management
- Don't destructure widget state (breaks reactivity)
- Use widget-ui components for consistent styling
- Handle loading, error, and data states

**Complete Example:**
```svelte
<script lang="ts">
  import type { ClientWidgetConfig } from '../types';
  import widgetDef from './meta';
  import { useWidget } from '../utils';
  import { wt } from '../utils/i18n';
  import { Block, Row, Cell, Status, Metric, Progress } from '$components/widget-ui';
  import { Skeleton } from '$components/ui';
  import IconAlertCircle from '~icons/lucide/alert-circle';

  interface Props {
    config: ClientWidgetConfig;
  }

  let { config }: Props = $props();

  // useWidget returns reactive state
  const widget = useWidget(widgetDef, () => config);

  // Create translation function
  const tw = wt(widgetDef.name);
</script>

<Block>
  {#if widget.loading && !widget.data}
    <!-- Loading state (first load) -->
    <div class="space-y-2">
      <Skeleton class="h-4 w-24" />
      <Skeleton class="h-4 w-32" />
    </div>
  {:else if widget.error}
    <!-- Error state -->
    <div class="flex items-center gap-2 text-destructive text-sm">
      <IconAlertCircle class="h-4 w-4" />
      <span>{widget.error}</span>
    </div>
  {:else if widget.data}
    <!-- Data state -->
    <Status
      status={widget.data.totalContainers > 0 ? 'healthy' : 'error'}
      label="Containers"
    />

    <Block layout="grid" columns={2}>
      <Metric
        label={$tw('labels.running')}
        value={widget.data.runningContainers}
        variant="success"
      />
      <Metric
        label={$tw('labels.stopped')}
        value={widget.data.stoppedContainers}
        variant="muted"
      />
    </Block>

    <Row
      label={$tw('labels.total')}
      value={widget.data.totalContainers}
    />
  {/if}
</Block>
```

**State Properties:**
- `widget.data` - Current data (validated by dataSchema)
- `widget.loading` - True during fetch
- `widget.error` - Error message (if failed)

**Reactivity Notes:**
```typescript
// ✅ Correct - maintains reactivity
const widget = useWidget(widgetDef, () => config);
// Access: widget.data, widget.loading, widget.error

// ❌ Wrong - breaks reactivity
const { data, loading, error } = useWidget(widgetDef, () => config);
```

## Widget UI Components

Located in `src/lib/components/widget-ui/`, these components provide consistent styling.

### Block

Container component for widget content.

```svelte
<!-- Default (vertical stack) -->
<Block>
  <Row label="Status" value="Online" />
  <Row label="Users" value={42} />
</Block>

<!-- Grid layout -->
<Block layout="grid" columns={2}>
  <Cell label="CPU">50%</Cell>
  <Cell label="Memory">80%</Cell>
</Block>

<!-- Grid with 3 columns -->
<Block layout="grid" columns={3}>
  <Cell label="A">10</Cell>
  <Cell label="B">20</Cell>
  <Cell label="C">30</Cell>
</Block>
```

**Props:**
- `layout?: 'stack' | 'grid'` - Layout mode (default: `'stack'`)
- `columns?: number` - Grid columns (default: `2`)

### Row

Key-value row display.

```svelte
<Row label="Status" value="Online" />
<Row label="Active Users" value={42} />
<Row label="Uptime" value="99.9%" />
```

**Props:**
- `label: string` - Left side label
- `value: string | number` - Right side value

### Cell

Grid cell with label and content.

```svelte
<Block layout="grid" columns={2}>
  <Cell label="CPU">
    <span class="text-green-500">50%</span>
  </Cell>
  <Cell label="Memory">
    <Progress value={80} max={100} />
  </Cell>
</Block>
```

**Props:**
- `label: string` - Cell label

### Status

Status indicator with icon and label.

```svelte
<Status status="healthy" />
<Status status="healthy" label="Service Online" />
<Status status="error" label="Service Down" />
<Status status="warning" label="High CPU" />
```

**Props:**
- `status: 'healthy' | 'error' | 'warning'`
- `label?: string` - Optional text label

**Variants:**
- `healthy` - Green check icon
- `error` - Red X icon
- `warning` - Orange warning icon

### Metric

Large number display with label.

```svelte
<Metric label="Active Users" value={42} />
<Metric label="CPU Usage" value={75} unit="%" />
<Metric label="Temperature" value={65} unit="°C" variant="warning" />
```

**Props:**
- `label: string` - Metric name
- `value: number | string` - Metric value
- `unit?: string` - Optional unit
- `variant?: 'default' | 'success' | 'warning' | 'error' | 'muted'` - Color variant

### Progress

Progress bar with label.

```svelte
<Progress label="Disk Usage" value={75} max={100} />
<Progress label="Memory" value={8} max={16} unit="GB" />
```

**Props:**
- `label: string` - Progress bar label
- `value: number` - Current value
- `max: number` - Maximum value
- `unit?: string` - Optional unit for label

## Advanced Topics

### Internationalization (i18n)

Widgets support multiple languages via i18n system.

**1. Create translation keys:**

`src/lib/i18n/translations/en/widgets.json`:
```json
{
  "portainer": {
    "labels": {
      "running": "Running",
      "stopped": "Stopped",
      "total": "Total"
    }
  }
}
```

`src/lib/i18n/translations/zh-TW/widgets.json`:
```json
{
  "portainer": {
    "labels": {
      "running": "運行中",
      "stopped": "已停止",
      "total": "總計"
    }
  }
}
```

**2. Use in Widget.svelte:**

```svelte
<script lang="ts">
  import { wt } from '../utils/i18n';
  import widgetDef from './meta';

  // Create translation function for this widget
  const tw = wt(widgetDef.name);
</script>

<Row label={$tw('labels.running')} value={data.running} />
<Row label={$tw('labels.stopped')} value={data.stopped} />
<Row label={$tw('labels.total')} value={data.total} />
```

### Custom Cache Keys

By default, cache key is `widget.type:widget.id`. Override for specific needs:

```typescript
export const POST = createHandler({
  varsSchema: widget.varsSchema,

  async fetch(vars, context) {
    // context.config has full widget config
    return fetchData(vars);
  },

  // Custom cache key function
  getCacheKey: (vars, context) => {
    // Example: Share cache across widgets with same URL
    return `my-widget:${vars.url}`;
  },
});
```

### Conditional Requests

Skip requests based on widget state:

```typescript
export const POST = createHandler({
  varsSchema: widget.varsSchema,

  async fetch(vars) {
    // Only fetch if URL is provided
    if (!vars.url) {
      return { status: 'not-configured' };
    }

    return fetchData(vars);
  },
});
```

### Polling Control

Client controls polling interval via config:

```yaml
widget:
  type: my-widget
  interval: 30000  # Poll every 30 seconds
  vars:
    url: https://api.example.com
```

Disable polling (manual refresh only):
```yaml
widget:
  type: my-widget
  interval: 0  # No auto-refresh
```

## Best Practices

### Security

1. **Never expose sensitive data to client**
```typescript
// ✅ Good - API key only in varsSchema (server-side)
varsSchema: z.object({
  apiKey: z.string(),
})

// ❌ Bad - API key in dataSchema (sent to client)
dataSchema: z.object({
  apiKey: z.string(), // Don't do this!
})
```

2. **Validate all inputs with Zod**
```typescript
varsSchema: z.object({
  url: z.string().url(), // Ensures valid URL
  timeout: z.number().min(1000).max(60000), // Bounds check
})
```

3. **Handle errors gracefully**
```typescript
async fetch(vars) {
  try {
    const res = await fetch(vars.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (error) {
    // Error message shown to user
    throw new Error(`Failed to fetch: ${error.message}`);
  }
}
```

### Performance

1. **Keep dataSchema minimal**
```typescript
// ✅ Good - only what UI needs
dataSchema: z.object({
  activeUsers: z.number(),
  status: z.string(),
})

// ❌ Bad - unnecessary data
dataSchema: z.object({
  activeUsers: z.number(),
  status: z.string(),
  _rawResponse: z.any(), // Don't send raw API response
  _debug: z.object({ /* ... */ }), // Don't send debug data
})
```

2. **Use appropriate cache TTL**
```typescript
// Fast-changing data (system stats)
cacheTtl: 5000, // 5 seconds

// Moderate (service status)
cacheTtl: 10000, // 10 seconds (default)

// Slow-changing data (configuration)
cacheTtl: 60000, // 1 minute
```

3. **Avoid expensive computations in Widget.svelte**
```typescript
// ✅ Good - do in handler
async fetch(vars) {
  const data = await fetchData(vars);
  return {
    total: data.items.length, // Calculate server-side
    average: data.items.reduce((sum, i) => sum + i.value, 0) / data.items.length,
  };
}

// ❌ Bad - do in component
// let total = $derived(widget.data.items.length); // Computed every render
```

### Code Quality

1. **Type safety**
```typescript
// ✅ Good - explicit types
import type { WidgetData, WidgetVars } from './meta';

async fetch(vars: WidgetVars): Promise<WidgetData> {
  // TypeScript ensures return matches dataSchema
  return { /* ... */ };
}
```

2. **Error messages**
```typescript
// ✅ Good - specific error messages
if (!response.ok) {
  throw new Error(`API returned ${response.status}: ${response.statusText}`);
}

// ❌ Bad - generic error
if (!response.ok) {
  throw new Error('Request failed');
}
```

3. **Consistent naming**
```typescript
// Widget folder: src/lib/widgets/my-widget/
// Widget name: 'my-widget' (in meta.ts)
// Config type: 'my-widget' (in YAML)
```

## Examples

### Simple Status Widget

```typescript
// meta.ts
const widget = defineWidget({
  name: 'simple-status',
  dataSchema: z.object({
    status: z.enum(['up', 'down']),
  }),
  varsSchema: z.object({
    url: z.string().url(),
  }),
});
```

```typescript
// handler.ts
export const POST = createHandler({
  varsSchema: widget.varsSchema,
  async fetch(vars) {
    const response = await fetch(vars.url);
    return { status: response.ok ? 'up' : 'down' };
  },
});
```

```svelte
<!-- Widget.svelte -->
<Block>
  {#if widget.data}
    <Status
      status={widget.data.status === 'up' ? 'healthy' : 'error'}
      label={widget.data.status === 'up' ? 'Online' : 'Offline'}
    />
  {/if}
</Block>
```

### Advanced Stats Widget

See existing widgets for complete examples:
- `src/lib/widgets/portainer/` - Container stats
- `src/lib/widgets/jellyfin/` - Media library
- `src/lib/widgets/proxmox/` - VM resources

## Troubleshooting

### Widget not appearing in config autocomplete

1. Check widget name matches folder name
2. Run `bun run schema` to regenerate schemas
3. Restart VS Code / IDE

### Data not updating

1. Check `interval` in widget config
2. Verify handler is returning data matching `dataSchema`
3. Check browser console for errors
4. Test endpoint manually:
   ```bash
   curl -X POST http://localhost:5173/api/widgets/my-widget \
     -H "Content-Type: application/json" \
     -d '{"id":"widget-1"}'
   ```

### TypeScript errors

1. Ensure types are exported from `meta.ts`
2. Run `bun run check` for type checking
3. Check Zod schema matches return type

### Cache not working

1. Verify `createHandler()` is used (not raw POST handler)
2. Check cache TTL is > 0
3. Look for errors in server logs

## Related Documentation

- [Development Guide](DEVELOPMENT.md) - Project architecture
- [Gadget Development](GADGETS.md) - Header bar components
