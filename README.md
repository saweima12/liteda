# Liteda

A lightweight, memory-efficient dashboard for your homelab. Built with SvelteKit for fast performance and simple YAML configuration.

![black-mode](./images/0.png)

## ✨ Features

- 🚀 **Lightweight** - ~50-80MB base memory, ~100MB during active polling
- ⚡ **Fast** - SvelteKit SSR with smart caching (default 10s TTL)
- 📱 **PWA Support** - Install as app, offline support, mobile-friendly
- 📄 **Simple Config** - YAML files + Markdown pages, no database needed
- ✨ **IDE Support** - JSON schema validation with autocompletion
- 🎨 **Customizable** - Themes, backgrounds, flexible header layout
- 📄 **Multi-page** - Organize services into tabbed pages (YAML or Markdown)
- 🔀 **SSR Proxy** - Server-side API calls, no CORS issues
- 🧩 **Extensible** - 13+ built-in widgets for popular homelab services

## 🚀 Quick Start

### Using Bun

```bash
# Install dependencies
bun install

# Development server (http://localhost:5173)
bun dev

# Build for production
bun run build

# Preview production build
bun preview
```

### Using Docker

**Quick Start:**

```bash
# 1. Clone repository
git clone https://github.com/your-username/liteda.git
cd liteda

# 2. Start with Docker Compose (config auto-initialized on first run)
docker compose up -d

# 3. Visit http://localhost:3000
```

**Configuration:**

Config files are automatically created in `./config/` on first run with sensible defaults.

To customize:

```bash
# Edit settings
nano config/settings.yaml

# Edit services
nano config/services.yaml

# Restart to apply changes
docker compose restart
```

**Manual Docker Run:**

```bash
# Build image
docker build -t liteda .

# Create config directory
mkdir -p config

# Run container
docker run -d \
  --name liteda \
  -p 3000:3000 \
  -v ./config:/app/config \
  --restart unless-stopped \
  liteda
```

**Local Development with Docker:**

For development with hot reload:

```bash
# Use dev compose file
docker compose -f docker-compose.dev.yml up

# Visit http://localhost:5173 (Vite dev server)
```

This mounts your source code into the container for live reload.

### PWA Installation

Liteda is a Progressive Web App (PWA) that can be installed on any device:

**Desktop (Chrome/Edge/Brave):**
1. Look for the install icon (⊕) in the address bar
2. Click "Install" or use `Ctrl/Cmd + Shift + A`

**Mobile (iOS - Safari):**
1. Tap Share → "Add to Home Screen"

**Mobile (Android - Chrome):**
1. Tap menu (⋮) → "Add to Home Screen"

**Features:**
- 📴 Works offline with intelligent caching
- 📱 Native app-like experience
- 🔄 Auto-updates when available
- ⚡ Faster load times

See [docs/PWA.md](docs/PWA.md) for detailed documentation.

**Generate PWA Icons:**
```bash
# Requires Inkscape or ImageMagick
bun run pwa:icons
```

### Configuration Hot Reload

Config hot reload is **enabled by default in dev mode**, **disabled in production**.

```bash
# Development (default: enabled)
bun dev

# Development (disable)
AUTO_RELOAD=false bun dev

# Production (enable - not recommended)
AUTO_RELOAD=true bun preview
```

**Behavior:**
- Development: Config changes trigger automatic server restart
- Production: Requires `AUTO_RELOAD=true` to enable
- Browser refresh needed to see changes
- Invalid config keeps previous valid configuration
- Features (Docker, K8s) require full server restart

**What's reloaded:**
- ✅ Settings, services, widgets, gadgets, markdown
- ❌ Features (side effects like Docker connections)

## ⚙️ Configuration

All configuration files are in the `config/` directory:

```
config/
├── settings.yaml      # Global settings, theme, layout
├── services.yaml      # Default home page services
└── pages/             # Additional pages
    ├── media.yaml     # YAML page
    ├── infra.yaml
    └── notes.md       # Markdown page with frontmatter
```

### Basic Settings

**config/settings.yaml**

```yaml
title: My Homelab
theme: dark  # light, dark, auto

# Optional background image
background:
  image: https://example.com/bg.jpg
  opacity: 0.3
  blur: 2

layout:
  columns: 3  # Default column count for service groups

  # Customize header bar with gadgets
  header:
    - type: resources      # System monitor
    - type: spacer         # Push items to the right
    - type: weather        # Weather display
      vars:
        latitude: 25.0330
        longitude: 121.5654
        label: "Taipei"
    - type: search         # Global search (⌘K)
    - type: theme-switcher # Theme toggle

# Define pages (tabs)
pages:
  - id: home
    name: Home
    icon: home
    file: services.yaml
  - id: media
    name: Media
    icon: play-circle
    file: pages/media.yaml
  - id: notes
    name: Notes
    icon: file-text
    file: pages/notes.md
```

### Service Configuration

**config/services.yaml** or **config/pages/media.yaml**

```yaml
# Flat service group
- name: Quick Access
  columns: 2
  equalHeight: true  # Cards in same row have equal height
  items:
    - name: Portainer
      icon: portainer
      url: https://portainer.local
      description: Container management

      # Optional: Add live data widget
      widget:
        type: portainer
        interval: 10000  # Poll every 10s (has server-side cache)
        vars:
          url: https://portainer.local
          key: "your-api-key"
          env: 1

    - name: Jellyfin
      icon: jellyfin
      url: https://jellyfin.local
      widget:
        type: jellyfin
        interval: 10000
        vars:
          url: https://jellyfin.local
          key: "your-api-key"

# Nested service groups
- name: Infrastructure
  icon: server
  columns: 2
  groups:
    - name: Monitoring
      items:
        - name: Grafana
          icon: grafana
          url: https://grafana.local

    - name: Management
      items:
        - name: Proxmox
          icon: proxmox
          url: https://pve.local

# Bookmarks style (compact tags)
- name: Quick Links
  type: bookmarks
  items:
    - name: Google
      url: https://google.com
      icon: google
    - name: GitHub
      url: https://github.com
      icon: github
```

### Markdown Pages

Create `.md` files in `config/pages/` with frontmatter for mixed content:

**config/pages/notes.md**

```markdown
---
blocks:
  tools:
    name: Common Tools
    type: services
    columns: 2
    items:
      - name: Portainer
        url: https://portainer.local
        icon: portainer
        widget:
          type: portainer
          interval: 10000
          vars:
            url: https://portainer.local
            key: "your-api-key"
---

# Server Documentation

Some notes about your homelab setup...

## Service Cards Injection

Use block markers to inject service groups:

::: block:tools :::

More content below the service cards...
```

### Group Gadgets (Advanced)

Organize header gadgets with flexible alignment:

```yaml
layout:
  header:
    # Left-aligned group
    - type: group
      vars:
        align: left  # left, center, right
        items:
          - type: resources
            vars:
              cpu: true
              memory: true
              refresh: 10000
          - type: weather
            vars:
              latitude: 25.0330
              longitude: 121.5654

    # Spacer pushes to the right
    - type: spacer

    # Right-aligned group
    - type: group
      vars:
        align: right
        items:
          - type: search
          - type: theme-switcher
```

## 🧩 Built-in Widgets

Widgets display live data from your services. All widgets support:
- Server-side caching (default 10s TTL, configured via `interval`)
- Secure API key handling (never exposed to browser)
- Auto-refresh with configurable intervals

### Available Widgets

**Infrastructure** (7 widgets)
- `portainer` - Container management stats
- `proxmox` - VM/LXC resource usage
- `nginx-proxy-manager` - Proxy hosts count
- `cloudflared` - Tunnel status
- `adguard` - DNS queries and blocking stats
- `grafana` - Dashboard and datasource count
- `uptime-kuma` - Service uptime monitoring

**Media** (6 widgets)
- `jellyfin` - Media library stats
- `plex` - Library and stream info
- `sonarr` - TV series monitoring
- `radarr` - Movie monitoring
- `qbittorrent` - Torrent stats
- `tautulli` - Plex activity tracking

> 📚 See [Widget Development Guide](docs/WIDGETS.md) for creating custom widgets

## 📊 Built-in Gadgets

Gadgets are header bar components. Available gadgets:

- `title` - Display site title from settings
- `spacer` - Flexible space (push items right)
- `theme-switcher` - Light/dark mode toggle
- `search` - Global search (⌘K / Ctrl+K)
- `resources` - System monitor (CPU, memory, disk, temp)
- `weather` - Current weather with detailed popover
- `group` - Organize gadgets with alignment (left/center/right)

> 📚 See [Gadget Development Guide](docs/GADGETS.md) for creating custom gadgets

## 🎨 IDE Support

JSON schemas are automatically generated during build for autocomplete and validation.

Schemas are located in `config/schemas/`:
- `settings.schema.json` - For settings.yaml
- `services.schema.json` - For service YAML files

In VS Code, schemas are auto-applied via `.vscode/settings.json`.

To manually regenerate schemas:
```bash
bun run schema
```

## 📈 Performance & Caching

**Memory Usage:**
- Base: ~50-80 MB
- Active polling: ~80-100 MB
- Bounded growth with LRU cache (max 1000 entries)

**Caching System:**
- Default TTL: 10 seconds (configurable via widget `interval`)
- Server-side cache prevents duplicate API calls
- Automatic cleanup of expired entries
- Thundering herd prevention for concurrent requests

**Configuration Example:**
```yaml
widget:
  type: portainer
  interval: 10000  # Poll every 10s (client-side)
  vars:
    url: https://portainer.local
    key: "your-api-key"  # Secure: never sent to browser
```

Server caches the API response for 10s, so multiple clients share the same data.

## 🛠️ Tech Stack

- [SvelteKit](https://kit.svelte.dev/) - Full-stack framework
- [Svelte 5](https://svelte.dev/) - UI with runes ($state, $derived, $effect)
- [shadcn-svelte](https://shadcn-svelte.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first styling
- [Zod](https://zod.dev/) - Schema validation
- [mode-watcher](https://github.com/svecosystem/mode-watcher) - Theme management
- [unplugin-icons](https://github.com/unplugin/unplugin-icons) - Icon components (Lucide)
- [Dashboard Icons](https://github.com/walkxcode/dashboard-icons) - Service icons via CDN

## 🔧 Troubleshooting

### Permission denied on config files (Docker)

If you can't edit `config/settings.yaml` after starting with Docker:

**Quick Fix (Recommended):**
```bash
sudo chown -R $(id -u):$(id -g) config/
```

**Alternative (Permanent):**
Edit `docker-compose.yml` and uncomment the `user:` line:
```yaml
user: "${UID:-1000}:${GID:-1000}"
```

Then restart:
```bash
docker compose down && docker compose up -d
```

### Widget shows "offline" but service is running

**If using Docker:**
1. Check the widget URL is accessible from inside the container
2. For services on the host, use `host.docker.internal` instead of `localhost`:
   ```yaml
   widget:
     vars:
       url: http://host.docker.internal:9000  # Not localhost:9000
   ```
3. Or enable Docker widget with socket mount (see docker-compose.yml)

**General checks:**
- Verify the API endpoint URL is correct
- Check the API key is set in `vars`
- Look at container logs: `docker logs liteda`

### Config changes not taking effect

**Docker:**
```bash
docker compose restart
```

**Bun (with AUTO_RELOAD=false):**
```bash
# Stop and restart
bun preview
```

### Health check failing

Check if the server is running:
```bash
# Docker
docker logs liteda

# Test health endpoint
curl http://localhost:3000/health
```

## 📚 Documentation

- [Development Guide](docs/DEVELOPMENT.md) - Project structure and development workflow
- [Widget Development](docs/WIDGETS.md) - Creating custom widgets
- [Gadget Development](docs/GADGETS.md) - Creating custom header gadgets

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details
