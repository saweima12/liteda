# Widget Development Guide

## Quick Start

### 1. Copy the template

```bash
cp -r src/lib/widgets/_template src/lib/widgets/my-widget
```

### 2. Edit meta.ts

```typescript
// src/lib/widgets/my-widget/meta.ts
import { z } from 'zod';
import { defineWidget } from '../utils/define';
import Widget from './Widget.svelte';

const widget = defineWidget({
  name: 'my-widget',  // <- Unique widget identifier
  component: Widget,
  description: 'My awesome widget',
  icon: 'server',

  dataSchema: z.object({
    status: z.enum(['online', 'offline']),
    uptime: z.string(),
    connections: z.number(),
  }),

  varsSchema: z.object({
    apiKey: z.string(),
    endpoint: z.string().url(),
  }),
});

export default widget;
```

### 3. Implement handler.ts

```typescript
// src/lib/widgets/my-widget/handler.ts
import { createHandler } from '../utils/create-handler';
import widget from './meta';

export const POST = createHandler({
  varsSchema: widget.varsSchema,

  async fetch(vars) {
    // Types are inferred from varsSchema
    const response = await fetch(vars.endpoint, {
      headers: { Authorization: `Bearer ${vars.apiKey}` },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    
    const data = await response.json();
    
    // Return data matching dataSchema
    return {
      status: data.isOnline ? 'online' : 'offline',
      uptime: data.uptime,
      connections: data.activeConnections,
    };
  },
});
```

### 4. Create UI (Widget.svelte)

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

  // Types are inferred from widgetDef.dataSchema
  const widget = useWidget(widgetDef, () => config);
</script>

<Block>
  {#if widget.loading && !widget.data}
    <Skeleton class="h-16" />
  {:else if widget.error}
    <div class="flex items-center gap-2 text-destructive text-sm">
      <IconAlertCircle class="h-4 w-4" />
      <span>{widget.error}</span>
    </div>
  {:else if widget.data}
    <Status status={widget.data.status === 'online' ? 'healthy' : 'error'} />
    <Row label="Uptime" value={widget.data.uptime} />
    <Metric label="Connections" value={widget.data.connections} />
  {/if}
</Block>
```

### 5. Use in configuration

```yaml
# config/services.yaml
- name: My Services
  items:
    - name: My Server
      icon: server
      widget:
        type: my-widget  # <- Must match name in defineWidget
        interval: 10000  # Polling interval (ms)
        vars:
          apiKey: "your-secret-key"
          endpoint: "https://api.example.com/status"
```

---

## Widget Structure

```
src/lib/widgets/my-widget/
├── meta.ts       # defineWidget + schemas
├── handler.ts    # Server-side API handler
└── Widget.svelte # UI component
```

| File | Environment | Purpose |
|------|-------------|---------|
| meta.ts | Client + Server | Widget definition and schemas |
| handler.ts | Server Only | Data fetching, sensitive operations |
| Widget.svelte | Client | UI rendering |

---

## Reactivity

`useWidget` returns a reactive object. Due to Svelte 5 runes behavior, **do not destructure** the return value directly.

### Recommended: Direct access

```svelte
const widget = useWidget(widgetDef, () => config);

// Access properties directly in template
{#if widget.loading}...{/if}
{#if widget.data}{widget.data.status}{/if}
```

### Alternative: Extract with `$derived`

If you prefer separate variables, wrap with `$derived` to maintain reactivity:

```svelte
const widget = useWidget(widgetDef, () => config);

const data = $derived(widget.data);
const loading = $derived(widget.loading);
const error = $derived(widget.error);
```

### ❌ Wrong: Direct destructuring

```svelte
// This breaks reactivity - values will be stuck at initial state
const { data, loading, error } = useWidget(widgetDef, () => config);
```

---

## API Reference

### `defineWidget(config)`

Define a widget with full type safety.

```typescript
const widget = defineWidget({
  name: string;           // Unique widget identifier
  component: Component;   // Svelte component
  dataSchema: ZodType;    // Response data schema
  varsSchema?: ZodType;   // Server-side vars schema (optional)
  description?: string;   // Widget description
  icon?: string;          // Lucide icon name
});
```

### `useWidget(widget, getConfig)`

Type-safe widget hook. Pass the widget object from meta.ts.

```typescript
import widgetDef from './meta';
import { useWidget } from '../utils';

const widget = useWidget(widgetDef, () => config);

// Properties
widget.data     // TData | null (inferred from dataSchema)
widget.error    // string | null  
widget.loading  // boolean
widget.refresh  // () => Promise<void>
```

### `createHandler(options)`

Create a server-side handler. Types are inferred from varsSchema.

```typescript
import widget from './meta';

export const POST = createHandler({
  varsSchema: widget.varsSchema,
  async fetch(vars) {
    // vars type is inferred from varsSchema
    return { ... };
  },
});
```

---

## Widget UI Components

### `<Block>`
Container component supporting stack and grid layouts.

```svelte
<Block title="Section">
  <!-- stack layout (default) -->
</Block>

<Block layout="grid" columns={3}>
  <!-- grid layout -->
</Block>
```

### `<Row>`
Key-value display.

```svelte
<Row label="Status" value="Online" icon={IconServer} />
```

### `<Cell>`
Cell within a grid.

```svelte
<Block layout="grid" columns={2}>
  <Cell label="CPU">45%</Cell>
  <Cell label="RAM">2.1 GB</Cell>
</Block>
```

### `<Status>`
Status indicator.

```svelte
<Status status="healthy" />
<Status status="warning" label="High Load" />
<Status status="error" />
```

### `<Metric>`
Large number display with optional trend.

```svelte
<Metric label="Users" value={1234} />
<Metric label="Revenue" value={99.5} unit="%" trend="up" trendValue="+5%" />
```

### `<Progress>`
Progress bar with auto-coloring.

```svelte
<Progress label="Disk" value={75} max={100} />
<Progress value={95} variant="danger" />
```

---

## Security Notes

1. **`vars` are never sent to the client**
   - `vars` defined in config only exist on the server side
   - Client only receives `id`, `type`, `interval`

2. **API Key handling**
   - All sensitive information goes in `varsSchema`
   - Use them in the `fetch` function of `handler.ts`

3. **Validation**
   - Zod schemas validate vars at runtime
   - Invalid vars will log a warning but won't break execution

---

## Troubleshooting

### Widget not appearing?

1. Verify `name` in `defineWidget` matches `type` in config
2. Check console for error messages

### Data not updating?

1. Verify `interval` is configured correctly
2. Check handler for errors
3. Use `widget.refresh()` to manually refetch

### Reactivity not working?

Don't destructure `useWidget` return value:

```typescript
// ❌ Wrong - breaks reactivity
const { data, loading } = useWidget(widgetDef, () => config);

// ✅ Correct - maintains reactivity
const widget = useWidget(widgetDef, () => config);

// ✅ Also correct - use $derived if you want separate variables
const data = $derived(widget.data);
```