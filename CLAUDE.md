# CLAUDE.md

This file provides guidance for Claude Code when working in the Liteda repository.

## Project Overview
Liteda is a lightweight homelab dashboard built with SvelteKit.
- **Tech Stack**: Svelte 5 (Runes), SvelteKit, Bun, Zod, Tailwind CSS.
- **Config**: YAML files in `config/` (settings, services, pages).
- **Architecture**: SSR proxy for all API calls to avoid CORS; server-side caching.

## Commands
- **Install**: `bun install`
- **Dev**: `bun dev` (http://localhost:5173)
- **Build**: `bun run build` (includes schema generation)
- **Preview**: `bun preview`
- **Check**: `bun run check`
- **Schema**: `bun run schema`

## Key Patterns

### Svelte 5 Runes
- Use `$state`, `$derived`, `$effect`, `$props`.
- **Caution**: Access reactive properties directly (e.g., `widget.data`), do NOT destructure.

### Widget System (`src/lib/widgets/`)
- Three-file structure: `meta.ts` (schemas), `handler.ts` (server fetch), `Widget.svelte` (UI).
- Use `createHandler()` for server-side logic and `useWidget()` for client state.
- Auto-discovered via `registry.ts`.

### Gadget System (`src/lib/gadgets/`)
- Header components like `weather`, `resources`, `search`.
- Use `defineGadget()` in `meta.ts`.
- Server data via `createGadgetHandler()` in `handler.ts` + `/api/gadgets/[type]`.

### Features System (`src/lib/features/`)
- Lazy-loaded complex logic (e.g., `docker-discovery`).
- Implement `Feature` interface; manually register in `registry.ts`.

### UI & Icons
- **Components**: shadcn-svelte in `src/lib/components/ui/`.
- **Helpers**: Widget-specific UI in `src/lib/components/widget-ui/`.
- **Icons**: Always use `unplugin-icons`: `import IconName from '~icons/lucide/icon-name'`.

## Security
- **Never** expose sensitive `vars` (API keys) to the client.
- Handlers run server-side and look up config by ID.
- Use Zod schemas for all external data and configuration.
