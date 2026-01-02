# Liteda

A lightweight, fast dashboard for your homelab. Built with SvelteKit and shadcn-svelte.

## Features

- 🚀 **Lightweight** - ~50-80MB memory usage (vs 150-200MB for Next.js alternatives)
- ⚡ **Fast** - SvelteKit with Svelte 5 runes
- 📄 **YAML Config** - Simple configuration files
- 🎨 **Themeable** - Light/dark mode with shadcn-svelte
- 📱 **Multi-page** - Tab-based navigation with URL hash
- 🔌 **Extensible** - Easy widget system with auto-discovery

## Quick Start

```bash
# Install dependencies
bun install

# Development
bun dev

# Build
bun run build

# Preview production build
bun preview
```

## Configuration

All configuration files are in the `config/` directory:

```
config/
├── settings.yaml      # Global settings, theme, pages
├── services.yaml      # Home page services
├── bookmarks.yaml     # Bookmarks
└── pages/             # Additional pages
    ├── media.yaml
    └── infra.yaml
```

### settings.yaml

```yaml
title: My Dashboard
theme: dark  # light, dark, auto

pages:
  - id: home
    name: Home
    icon: home
    file: services.yaml
  - id: media
    name: Media
    icon: play
    file: pages/media.yaml

layout:
  columns: 3
```

### services.yaml

```yaml
- name: Infrastructure
  items:
    - name: Proxmox
      icon: proxmox
      url: https://pve.local:8006
      description: VM management
      widget:
        type: demo
        interval: 5000
```

## Creating Widgets

Widgets are auto-discovered. Create a new folder in `src/lib/widgets/`:

```
src/lib/widgets/mywidget/
├── meta.ts        # Widget metadata
├── handler.ts     # API handler (server-side)
└── MyWidget.svelte  # UI component
```

### meta.ts

```typescript
import type { WidgetMeta } from '../types';
import MyWidget from './MyWidget.svelte';

export default {
  name: 'mywidget',
  component: MyWidget,
  description: 'My custom widget',
} satisfies WidgetMeta;
```

### handler.ts

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  const config = await request.json();
  
  // Fetch data from your service
  const data = { /* ... */ };
  
  return json(data);
};
```

### MyWidget.svelte

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { WidgetConfig } from '../types';

  let { config }: { config: WidgetConfig } = $props();
  let data = $state(null);

  async function fetchData() {
    const res = await fetch('/api/widgets/mywidget', {
      method: 'POST',
      body: JSON.stringify(config),
    });
    data = await res.json();
  }

  onMount(() => {
    fetchData();
    const id = setInterval(fetchData, config.interval || 30000);
    return () => clearInterval(id);
  });
</script>

{#if data}
  <!-- Render your widget -->
{/if}
```

## Docker

```bash
docker build -t liteda .
docker run -p 3000:3000 -v ./config:/app/config liteda
```

Or with docker-compose:

```bash
docker compose up -d
```

## Tech Stack

- [SvelteKit](https://kit.svelte.dev/) - Framework
- [Svelte 5](https://svelte.dev/) - UI with runes
- [shadcn-svelte](https://shadcn-svelte.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [mode-watcher](https://github.com/svecosystem/mode-watcher) - Theme management

## License

MIT
