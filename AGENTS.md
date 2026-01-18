# AGENTS.md

## Commands

```bash
# Development
bun dev                 # Start dev server on http://0.0.0.0:5173

# Build & Preview
bun run build           # Production build (includes schema generation)
bun preview             # Preview production build

# Maintenance
bun run check           # Run svelte-check for types and syntax
bun run schema          # Regenerate JSON schemas for YAML validation
```

## Code Style

### TypeScript & Type Safety
- **Strict Mode**: Enabled in `tsconfig.json`.
- **Zod Validation**: Always use Zod schemas for config, data, and variables.
- **Type Inference**: Export types inferred from schemas: `export type MyData = z.infer<typeof mySchema>`.
- **Type Imports**: Use `import type { ... } from '...'`.
- **No `any`**: Prefer specific types over `any` or `unknown`.

### Svelte 5 Runes
- **Reactivity**: Use `$state` for reactive variables.
- **Computations**: Use `$derived` for values derived from other state.
- **Effects**: Use `$effect` for side effects (ensure proper cleanup).
- **Props**: Use `$props()` and destructure directly: `let { prop } = $props()`.
- **Destructuring**: **Don't destructure reactive objects** (like widget state) - breaks reactivity. Access properties directly.
- Example: `const widget = useWidget(...)` not `const { data } = widget`.

### Widget System Patterns
Widgets are auto-discovered live data components in `src/lib/widgets/[name]/`.

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
4. Build UI in `Widget.svelte` using `useWidget()` composable.
5. Auto-discovered via Vite glob in `src/lib/widgets/registry.ts`.

### Gadget System Patterns
Gadgets are header bar components in `src/lib/gadgets/[name]/`.

**Built-in Gadgets:**
- `title`, `spacer`, `theme-switcher`, `search`, `resources`, `weather`, `group`.

**Creating a gadget:**
1. Create folder: `src/lib/gadgets/my-gadget/`
2. Define `meta.ts` with `defineGadget()`.
3. Create `Gadget.svelte` with UI.
4. (Optional) Use `createGadgetHandler()` in `handler.ts` if server-side data is needed.
5. Auto-discovered via Vite glob in `src/lib/gadgets/registry.ts`.

### Features System Patterns
Features are lazy-loaded, complex extensions in `src/lib/features/[name]/`.

1. **`meta.ts`**: Metadata, schemas, and lazy loaders.
2. **`index.ts`**: Implementation of `Feature` interface (`init`, `destroy`).
3. **Manual Registration**: Add to `src/lib/features/registry.ts`.
4. **Lazy Loading**: Only imported if enabled in `settings.yaml`.

### UI & Icons
- **shadcn-svelte**: Use the CLI to add components: `bun x shadcn-svelte@latest add <component>`.
- **Icons**: Always use `unplugin-icons` for Lucide icons: `import IconSearch from '~icons/lucide/search'`.
- **Standard Components**: Use `src/lib/components/widget-ui/` helpers (Block, Row, Cell, Status, Metric).

### Internationalization (i18n)
- Use `$t` store from `src/lib/i18n/`.
- Translations in `src/lib/i18n/translations/`.

## Security
- **Never** expose `vars` (API keys, secrets) to client.
- Widget/Gadget handlers run server-side via `createHandler()` / `createGadgetHandler()`.
- Use `@ts-expect-error` for Bun-specific TLS options in fetch if needed.

## File Organization
- `src/lib/widgets/`: Service-specific widgets.
- `src/lib/gadgets/`: Header bar components.
- `src/lib/features/`: Optional heavy functionality.
- `src/lib/config/`: Loader, schema, cache logic.
- `src/lib/components/ui/`: shadcn-svelte base components.
- `src/lib/components/widget-ui/`: Domain-specific UI helpers.
