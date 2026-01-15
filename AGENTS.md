# AGENTS.md

## Commands

```bash
# Development
bun dev                 # Start dev server on http://0.0.0.0:5173

# Build
bun run build           # Production build
bun preview             # Preview production build

# Type checking
bun run check           # Run svelte-check

# Testing
# No test framework configured. Add vitest/uvu if needed.
```

## Code Style

### TypeScript & Type Safety
- Strict mode enabled in `tsconfig.json`
- Always use Zod schemas for data validation (config, widget data, vars, etc.)
- Export types inferred from Zod: `type MyData = z.infer<typeof mySchema>`
- Use `z.infer<typeof>` to ensure types stay in sync with schemas
- Prefer specific types over `any` or `unknown`
- Type imports: `import type { ... } from '...'`

### Svelte 5 Runes
- Use `$state` for reactive state variables
- Use `$derived` for computed values
- Use `$effect` for side effects (cleanup function supported)
- Use `$props` for component props (destructure directly: `let { prop } = $props()`)
- **Don't destructure reactive objects** - breaks reactivity. Access properties directly.
- Example: `const widget = useWidget(...)` not `const { data } = useWidget(...)`

### Widget System Patterns

**Creating a widget:**
1. Copy template: `cp -r src/lib/widgets/_template src/lib/widgets/my-widget`
2. Define schemas in `meta.ts` using `defineWidget()`:
   - `dataSchema`: shape of data returned from handler
   - `varsSchema`: server-side config (API keys, secrets) - optional
3. Implement `handler.ts` using `createHandler()`:
   ```ts
   export const POST = createHandler({
     varsSchema: widget.varsSchema,
     async fetch(vars) {
       const res = await fetch(vars.endpoint);
       if (!res.ok) throw new Error('Failed');
       return res.json(); // Must match dataSchema
     },
     cacheTtl: 10000, // Optional custom TTL
   });
   ```
4. Build UI in `Widget.svelte` using `useWidget()` composable
5. No registration needed - auto-discovered via Vite glob

**Widget component pattern:**
```svelte
<script lang="ts">
  import { useWidget } from '$lib/widgets/utils';
  import widgetDef from './meta';

  let { config, onStatus }: WidgetProps = $props();
  const widget = useWidget(widgetDef, () => config);

  $effect(() => {
    onStatus?.(new CustomEvent('status', {
      detail: { status: widget.status, latency: widget.latency }
    }));
  });
</script>
```

### Zod Schema Patterns
- Use `z.object()` for compound types
- Use `.optional()` for optional fields
- Use `.default(value)` for defaults on optional fields
- Use `.passthrough()` for addon configs (allow extra properties)
- Use `.refine()` for custom validation logic
- Export schemas and types:
  ```ts
  const schema = z.object({ ... });
  export { schema };
  export type MyType = z.infer<typeof schema>;
  ```

### Error Handling
- Widget handlers: Always return JSON with `{ data, status, latency, checkedAt }` (handled by `createHandler()`)
- Use `throw error(statusCode, { message })` from `@sveltejs/kit` for HTTP errors
- Log errors with `console.error()` before throwing/returning
- For fetch errors in widgets: throw - handler converts to `status: 'offline'`

### Naming Conventions
- Files: kebab-case for components, kebab-case for utilities
- Variables: camelCase (e.g., `currentPageId`, `serviceWidgetIds`)
- Types/Interfaces: PascalCase (e.g., `ServiceGroup`, `WidgetConfig`)
- Constants: UPPER_SNAKE_CASE for static values (e.g., `CONFIG_DIR`)
- Components: PascalCase with `.svelte` extension
- Functions: camelCase with descriptive verbs (e.g., `loadSettings`, `extractWidgets`)

### Import Patterns
- Use path aliases defined in `svelte.config.js`:
  - `$components` → `src/lib/components`
  - `$widgets` → `src/lib/widgets`
  - `$config` → `src/lib/config`
- Group imports:
  ```ts
  import { readFile } from 'fs/promises';
  import { error } from '@sveltejs/kit';
  import { z } from 'zod';
  import { createHandler } from '$lib/widgets/utils/create-handler';
  import type { RequestHandler } from '@sveltejs/kit';
  ```
- Icon imports via unplugin-icons: `import IconSettings from '~icons/lucide/settings'`

### Security
- **Never** expose widget `vars` (API keys, secrets) to client
- Widget handlers run server-side via `createHandler()` - config retrieved from server-side store
- Use `@ts-expect-error` for Bun-specific TLS options in fetch calls
- Sanitize markdown input via `marked` library

### File Organization
- Widgets: `src/lib/widgets/[name]/` with `meta.ts`, `handler.ts`, `Widget.svelte`
- Addons: `src/lib/addons/[name]/` with `meta.ts`, `Addon.svelte`
- Config: `src/lib/config/` with loader, schema, cache
- Routes: SvelteKit conventions (`+page.svelte`, `+page.server.ts`, etc.)
- Components: Reusable in `src/lib/components/ui/` (shadcn-svelte) and `src/lib/components/widget-ui/`

### Comments
- Add comments only for non-obvious logic
- Use `//` for single-line, `/* */` for multi-line
- Document widget schemas with inline comments

### Server-Side Code
- Use `import { error } from '@sveltejs/kit'` for HTTP errors
- Server hooks: `src/hooks.server.ts` (e.g., `export const init`)
- Load config at startup and cache - don't re-parse on every request
- Use `fs/promises` for async file operations

### Client-Side Code
- Use `$app/environment` for browser checks: `if (browser) { ... }`
- Use `$app/stores` for page data and navigation
- Use `onMount` for browser-only side effects with cleanup
- Use `window.addEventListener` in `onMount` with proper cleanup
