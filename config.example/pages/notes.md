---
blocks:
  # Block 1: Service cards with widget example
  tools:
    name: Infrastructure Services
    type: services
    columns: 2
    items:
      - name: Portainer
        url: https://portainer.local
        icon: portainer
        description: Container management
        # ⬇️ Uncomment to add live widget data
        # widget:
        #   type: portainer
        #   interval: 10000
        #   vars:
        #     url: https://portainer.local
        #     key: "your-api-key"
        #     env: 1
      
      - name: Grafana
        url: https://grafana.local
        icon: grafana
        description: Metrics and monitoring
      
      - name: Proxmox
        url: https://pve.local
        icon: proxmox
        description: Virtualization platform
      
      - name: Nginx Proxy Manager
        url: https://npm.local
        icon: nginx-proxy-manager
        description: Reverse proxy

  # Block 2: Nested groups example
  monitoring:
    name: Monitoring Stack
    type: services
    icon: activity
    columns: 2
    groups:
      - name: Metrics
        items:
          - name: Prometheus
            url: https://prometheus.local
            icon: prometheus
            description: Time-series database
          - name: Grafana
            url: https://grafana.local
            icon: grafana
            description: Visualization
      
      - name: Logs
        items:
          - name: Loki
            url: https://loki.local
            icon: grafana-loki
            description: Log aggregation
          - name: Uptime Kuma
            url: https://uptime.local
            icon: uptime-kuma
            description: Status monitoring

  # Block 3: Bookmarks example
  links:
    name: Quick Links
    type: bookmarks
    items:
      - name: GitHub
        url: https://github.com
        icon: github
      - name: Docker Hub
        url: https://hub.docker.com
        icon: docker
      - name: Proxmox Docs
        url: https://pve.proxmox.com/wiki
        icon: proxmox
      - name: Reddit Homelab
        url: https://reddit.com/r/homelab
        icon: reddit
---

# Markdown Pages Guide

> **Liteda's Unique Feature**: Mix Markdown documentation with live service cards.
> Define service blocks in the frontmatter, then inject them anywhere in your content.

## 1. Service Cards

Use the `:::block:name:::` syntax to inject service cards:

::: block:tools :::

**How it works:**
- Services are defined in the frontmatter `blocks` section above
- Use `::: block:tools :::` to inject them at any position
- Cards are interactive and can include live widget data

## 2. Nested Groups

You can organize services into nested groups:

::: block:monitoring :::

This example shows a two-level hierarchy: Monitoring Stack → Metrics/Logs.

## 3. Bookmarks

Compact bookmark-style cards for quick links:

::: block:links :::

Perfect for frequently accessed external resources.

## 4. Tables

Standard Markdown tables work great for documentation:

| Service | Port | Protocol | Notes |
|---------|------|----------|-------|
| Portainer | 9000 | HTTPS | Container management |
| Grafana | 3000 | HTTPS | Dashboards |
| Proxmox | 8006 | HTTPS | Virtualization |
| Nginx PM | 81 | HTTP | Proxy management |

> **Security Tip**: Store credentials in a password manager, not in documentation!

## 5. Code Blocks

Document common commands with syntax highlighting:

```bash
# Docker container management
docker ps                           # List running containers
docker logs -f <container>          # Follow logs
docker exec -it <container> sh      # Enter container
docker stats                        # Resource usage

# System monitoring
df -h                               # Disk usage
free -h                             # Memory usage
htop                                # Process monitor
ncdu                                # Interactive disk usage
```

```yaml
# Example widget configuration
widget:
  type: portainer
  interval: 10000
  vars:
    url: https://portainer.local
    key: "your-api-key"
```

## 6. Task Lists

Track maintenance tasks:

- [ ] Daily: Check service status
- [ ] Weekly: Review error logs
- [ ] Weekly: Check disk space
- [ ] Monthly: System updates
- [ ] Monthly: Backup verification
- [ ] Quarterly: Security audit
- [ ] Yearly: Hardware review

## 7. Callouts & Alerts

Use blockquotes for important information:

> **Important**: Always create VM snapshots before major updates!

> **Tip**: Use `docker compose logs -f` to debug startup issues.

> **Warning**: Mounting `/var/run/docker.sock` in containers has security implications.

## 8. Adding Live Widgets

To show live data on service cards, add a widget configuration in the frontmatter:

```yaml
- name: Portainer
  url: https://portainer.local
  icon: portainer
  widget:
    type: portainer        # Widget type
    interval: 10000        # Refresh every 10 seconds
    vars:                  # Server-side only (never sent to browser)
      url: https://portainer.local
      key: "your-api-key"
      env: 1
```

**Available widgets:**
- Infrastructure: `portainer`, `proxmox`, `nginx-proxy-manager`, `cloudflared`
- Monitoring: `grafana`, `uptime-kuma`, `adguard`
- Media: `jellyfin`, `plex`, `sonarr`, `radarr`, `qbittorrent`, `tautulli`

See [Widget Development](../../docs/WIDGETS.md) for creating custom widgets.

## 9. Markdown Features

### Headers

Use `#` for headers (h1 through h6).

### Lists

**Unordered:**
- Item one
- Item two
  - Nested item
  - Another nested

**Ordered:**
1. First step
2. Second step
3. Third step

### Emphasis

*Italic text* or _italic text_

**Bold text** or __bold text__

***Bold and italic*** or ___bold and italic___

### Links

[Internal link](/) - Link to home page

[External link](https://github.com) - Link to external site

[Documentation](../../README.md) - Link to README

### Images

Images work in Markdown pages:

```markdown
![Alt text](https://example.com/image.png)
```

## Learn More

- [Configuration Guide](../../README.md#configuration) - Full config reference
- [Widget Development](../../docs/WIDGETS.md) - Create custom widgets
- [Gadget Development](../../docs/GADGETS.md) - Create header gadgets
- [Development Guide](../../docs/DEVELOPMENT.md) - Project architecture
