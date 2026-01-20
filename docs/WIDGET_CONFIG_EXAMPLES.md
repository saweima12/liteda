# Widget Configuration Examples

This document provides configuration examples for all available widgets in Liteda.

## Table of Contents

- [Home Automation](#home-automation)
  - [Home Assistant](#home-assistant)
- [Code Hosting](#code-hosting)
  - [Forgejo](#forgejo)
- [Power Management](#power-management)
  - [PeaNUT (UPS Monitor)](#peanut-ups-monitor)
- [Media](#media)
  - [Immich](#immich)
  - [Jellyfin](#jellyfin)
  - [Plex](#plex)
- [Monitoring](#monitoring)
  - [Grafana](#grafana)
  - [Uptime Kuma](#uptime-kuma)
- [Containers](#containers)
  - [Portainer](#portainer)
- [Virtualization](#virtualization)
  - [Proxmox](#proxmox)
- [Networking](#networking)
  - [AdGuard Home](#adguard-home)
  - [Nginx Proxy Manager](#nginx-proxy-manager)
  - [Cloudflared](#cloudflared)
- [Download Managers](#download-managers)
  - [qBittorrent](#qbittorrent)
  - [Sonarr](#sonarr)
  - [Radarr](#radarr)

---

## Home Automation

### Home Assistant

Display statistics from your Home Assistant instance.

```yaml
# config/services.yaml
widgets:
  - type: home-assistant
    name: Home Assistant
    icon: home
    vars:
      url: http://homeassistant.local:8123
      token: ${HOME_ASSISTANT_TOKEN}
    interval: 30000  # Refresh every 30s
```

**Environment Variables:**
```bash
# .env or config/secrets.env
HOME_ASSISTANT_TOKEN=your_long_lived_access_token_here
```

**How to get token:**
1. Go to Home Assistant → Profile → Long-Lived Access Tokens
2. Create new token
3. Copy and add to environment variables

**Displays:**
- Total entities
- Number of domains (light, switch, etc.)
- Total automations
- Active automations (highlighted if not all active)

---

## Code Hosting

### Forgejo

Display statistics from your Git repositories.

**Also works with Gitea (Forgejo is a Gitea fork with 100% API compatibility).**

```yaml
# config/services.yaml
widgets:
  - type: forgejo
    name: Forgejo
    icon: git-branch
    vars:
      url: https://git.example.com
      token: ${FORGEJO_TOKEN}
      username: myuser  # Optional: show specific user's repos only
    interval: 60000  # Refresh every 60s
```

**Environment Variables:**
```bash
# .env or config/secrets.env
FORGEJO_TOKEN=your_forgejo_api_token_here
```

**How to get token:**
1. Go to Forgejo → Settings → Applications → Generate New Token
2. Give it a name (e.g., "Liteda Dashboard")
3. Select scopes: `read:repository`, `read:user`
4. Generate and copy token

**Displays:**
- Total repositories
- Total stars
- Total forks
- Open issues (highlighted if > 0)

---

## Power Management

### PeaNUT (UPS Monitor)

Monitor your UPS (Uninterruptible Power Supply) using PeaNUT.

**PeaNUT** is a dashboard for Network UPS Tools (NUT) that provides a REST API for UPS monitoring.

```yaml
# config/services.yaml
widgets:
  - type: peanut
    name: UPS
    icon: zap
    vars:
      url: http://peanut.local:5000
      key: ups  # UPS device name (default: ups)
      username: admin  # Optional: if auth is enabled
      password: ${PEANUT_PASSWORD}  # Optional
    interval: 10000  # Refresh every 10s for real-time monitoring
```

**Environment Variables:**
```bash
# .env or config/secrets.env
PEANUT_PASSWORD=your_peanut_password_here
```

**Setup PeaNUT:**

1. Install PeaNUT (Docker recommended):
```yaml
# docker-compose.yml
services:
  peanut:
    image: brandawg93/peanut:latest
    ports:
      - "5000:5000"
    environment:
      - UPS_HOST=192.168.1.100  # Your NUT server IP
      - UPS_PORT=3493
      - UPS_NAME=ups
      # Optional authentication
      # - WEB_USERNAME=admin
      # - WEB_PASSWORD=yourpassword
```

2. Configure widget with your PeaNUT URL

**Displays:**
- Battery charge (%) - color coded:
  - Green: > 50%
  - Yellow: 20-50%
  - Red: < 20%
- UPS load (%) - color coded:
  - Green: < 50%
  - Yellow: 50-80%
  - Red: > 80%
- Status (Online, On Battery, etc.)

**References:**
- [PeaNUT GitHub](https://github.com/Brandawg93/PeaNUT)
- [Network UPS Tools](https://networkupstools.org/)

---

## Media

### Immich

Display statistics from your Immich photo library.

```yaml
# config/services.yaml
widgets:
  - type: immich
    name: Immich
    icon: image
    vars:
      url: http://immich.local:2283
      apiKey: ${IMMICH_API_KEY}
    interval: 60000  # Refresh every 60s
```

**Environment Variables:**
```bash
# .env or config/secrets.env
IMMICH_API_KEY=your_immich_api_key_here
```

**How to get API key:**
1. Go to Immich → Account Settings → API Keys
2. Create new API key
3. Copy and add to environment variables

**Displays:**
- Total photos
- Total videos
- Total storage used (formatted)
- Number of users

---

### Jellyfin

```yaml
widgets:
  - type: jellyfin
    name: Jellyfin
    icon: play
    vars:
      url: http://jellyfin.local:8096
      apiKey: ${JELLYFIN_API_KEY}
    interval: 60000
```

---

### Plex

```yaml
widgets:
  - type: plex
    name: Plex
    icon: play-circle
    vars:
      url: http://plex.local:32400
      token: ${PLEX_TOKEN}
    interval: 60000
```

---

## Monitoring

### Grafana

```yaml
widgets:
  - type: grafana
    name: Grafana
    icon: chart-line
    vars:
      url: http://grafana.local:3000
      username: admin
      password: ${GRAFANA_PASSWORD}
    interval: 30000
```

---

### Uptime Kuma

```yaml
widgets:
  - type: uptime-kuma
    name: Uptime Kuma
    icon: activity
    vars:
      url: http://uptime-kuma.local:3001
      username: admin
      password: ${UPTIME_KUMA_PASSWORD}
    interval: 30000
```

---

## Containers

### Portainer

```yaml
widgets:
  - type: portainer
    name: Portainer
    icon: package
    vars:
      url: http://portainer.local:9000
      apiKey: ${PORTAINER_API_KEY}
    interval: 30000
```

---

## Virtualization

### Proxmox

```yaml
widgets:
  - type: proxmox
    name: Proxmox
    icon: server
    vars:
      url: https://proxmox.local:8006
      username: root@pam
      password: ${PROXMOX_PASSWORD}
      node: pve  # Your Proxmox node name
    interval: 30000
```

---

## Networking

### AdGuard Home

```yaml
widgets:
  - type: adguard
    name: AdGuard Home
    icon: shield
    vars:
      url: http://adguard.local:3000
      username: admin
      password: ${ADGUARD_PASSWORD}
    interval: 30000
```

---

### Nginx Proxy Manager

```yaml
widgets:
  - type: nginx-proxy-manager
    name: NPM
    icon: globe
    vars:
      url: http://npm.local:81
      email: admin@example.com
      password: ${NPM_PASSWORD}
    interval: 60000
```

---

### Cloudflared

```yaml
widgets:
  - type: cloudflared
    name: Cloudflare Tunnel
    icon: cloud
    vars:
      url: http://cloudflared.local:1234
    interval: 30000
```

---

## Download Managers

### qBittorrent

```yaml
widgets:
  - type: qbittorrent
    name: qBittorrent
    icon: download
    vars:
      url: http://qbittorrent.local:8080
      username: admin
      password: ${QBITTORRENT_PASSWORD}
    interval: 10000  # More frequent for download progress
```

---

### Sonarr

```yaml
widgets:
  - type: sonarr
    name: Sonarr
    icon: tv
    vars:
      url: http://sonarr.local:8989
      apiKey: ${SONARR_API_KEY}
    interval: 60000
```

---

### Radarr

```yaml
widgets:
  - type: radarr
    name: Radarr
    icon: film
    vars:
      url: http://radarr.local:7878
      apiKey: ${RADARR_API_KEY}
    interval: 60000
```

---

## Environment Variables

**Best practice:** Store all sensitive credentials in environment variables.

### Option 1: `.env` file (for Docker Compose)

```bash
# .env
HOME_ASSISTANT_TOKEN=eyJ0eXAiOiJKV1Q...
GITEA_TOKEN=1234567890abcdef...
IMMICH_API_KEY=abcdef1234567890...
PORTAINER_API_KEY=ptr_xyz123...
GRAFANA_PASSWORD=secure_password
```

### Option 2: `config/secrets.env`

```bash
# config/secrets.env
HOME_ASSISTANT_TOKEN=eyJ0eXAiOiJKV1Q...
GITEA_TOKEN=1234567890abcdef...
```

Then mount in Docker:
```yaml
# docker-compose.yml
services:
  liteda:
    image: liteda
    volumes:
      - ./config:/app/config
    env_file:
      - ./config/secrets.env
```

---

## Complete Example

Here's a complete `services.yaml` using all three new widgets:

```yaml
# config/services.yaml
services:
  - name: Home Automation
    icon: home
    widgets:
      - type: home-assistant
        name: Home Assistant
        icon: home
        vars:
          url: http://homeassistant.local:8123
          token: ${HOME_ASSISTANT_TOKEN}
        interval: 30000

  - name: Development
    icon: code
    widgets:
      - type: forgejo
        name: Forgejo
        icon: git-branch
        vars:
          url: https://git.example.com
          token: ${FORGEJO_TOKEN}
        interval: 60000

  - name: Media
    icon: image
    widgets:
      - type: immich
        name: Photos
        icon: image
        vars:
          url: http://immich.local:2283
          apiKey: ${IMMICH_API_KEY}
        interval: 60000

      - type: jellyfin
        name: Jellyfin
        icon: play
        vars:
          url: http://jellyfin.local:8096
          apiKey: ${JELLYFIN_API_KEY}
        interval: 60000
```

---

## Notes

- **Intervals:** Choose appropriate refresh intervals based on data change frequency
  - Fast-changing (downloads, system resources): 5-10s
  - Moderate (container status, monitoring): 30s
  - Slow-changing (media libraries, code repos): 60s+

- **Environment Variables:** Always use `${VARIABLE}` syntax in YAML for sensitive data

- **API Tokens:** Most services provide long-lived API tokens - prefer these over username/password where available

- **Testing:** Use the widget demo page to test configurations before adding to your dashboard

---

## Multi-Link Services

Services can include multiple clickable sub-links below the main card. This is useful for services with multiple sections or entry points.

### Basic Example

```yaml
# config/services.yaml
services:
  - name: Infrastructure
    icon: server
    widgets:
      - name: Proxmox
        icon: server
        url: https://proxmox.example.com:8006
        links:
          - name: Node 1
            url: https://proxmox.example.com:8006/#v1:0:=node/pve1
          - name: Node 2
            url: https://proxmox.example.com:8006/#v1:0:=node/pve2
          - name: Backups
            url: https://proxmox.example.com:8006/#v1:0:=storage/local/content
```

### With Icons

```yaml
services:
  - name: Media Server
    icon: play
    widgets:
      - name: Jellyfin
        icon: play
        url: https://jellyfin.example.com
        links:
          - name: Movies
            url: https://jellyfin.example.com/web/index.html#!/movies.html
            icon: film
          - name: TV Shows
            url: https://jellyfin.example.com/web/index.html#!/tv.html
            icon: tv
          - name: Music
            url: https://jellyfin.example.com/web/index.html#!/music.html
            icon: music
```

### Container Management

```yaml
services:
  - name: Containers
    icon: package
    widgets:
      - name: Portainer
        icon: package
        url: https://portainer.example.com
        links:
          - name: Containers
            url: https://portainer.example.com/#!/2/docker/containers
          - name: Images
            url: https://portainer.example.com/#!/2/docker/images
          - name: Networks
            url: https://portainer.example.com/#!/2/docker/networks
          - name: Volumes
            url: https://portainer.example.com/#!/2/docker/volumes
```

### Git Repositories

```yaml
services:
  - name: Development
    icon: code
    widgets:
      - name: Forgejo
        icon: git-branch
        url: https://git.example.com
        links:
          - name: Repositories
            url: https://git.example.com/explore/repos
          - name: Organizations
            url: https://git.example.com/explore/organizations
          - name: Pull Requests
            url: https://git.example.com/user/pulls
```

### Combined with Widgets

```yaml
services:
  - name: Home Automation
    icon: home
    widgets:
      - type: home-assistant
        name: Home Assistant
        icon: home
        url: https://homeassistant.example.com
        vars:
          url: https://homeassistant.example.com
          token: ${HOME_ASSISTANT_TOKEN}
        interval: 30000
        links:
          - name: Overview
            url: https://homeassistant.example.com/lovelace/0
          - name: Automations
            url: https://homeassistant.example.com/config/automation/dashboard
          - name: Devices
            url: https://homeassistant.example.com/config/devices/dashboard
```

### Link Configuration Options

Each link in the `links` array supports:

- **name** (required): Display name for the link
- **url** (required): Target URL
- **icon** (optional): Icon name (lucide icons or URL)
- **target** (optional): `_blank` (default) or `_self`

**Example:**
```yaml
links:
  - name: Admin Panel
    url: https://service.example.com/admin
    icon: shield
    target: _blank  # Opens in new tab
```

### Notes

- Sub-links appear below the main card content as compact buttons
- They work with or without widgets
- Links support the same icon system as main services (lucide icons or custom URLs)
- `onclick` events include `stopPropagation()` to prevent triggering the main card link
- Useful for services with multiple dashboards, sections, or related URLs
