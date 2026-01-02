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
        description: Container management
      - name: Grafana
        url: https://grafana.local
        icon: grafana
        description: Metrics dashboard
      - name: Prometheus
        url: https://prometheus.local
        icon: prometheus
        description: Monitoring
      - name: Traefik
        url: https://traefik.local
        icon: traefik
        description: Reverse proxy

  bookmarks:
    name: Development Resources
    type: bookmarks
    items:
      - name: GitHub
        url: https://github.com
        icon: github
      - name: Stack Overflow
        url: https://stackoverflow.com
        icon: stackoverflow
      - name: Reddit
        url: https://reddit.com
        icon: reddit
---

# Server Notes

This is a sample notes page demonstrating how to mix service links and Markdown content in Liteda.

::: block:tools :::

## Login Information

| Service | Username | Notes |
|---------|----------|-------|
| Proxmox | root | See password manager |
| Portainer | admin | Default password changed |

::: block:bookmarks :::

## Common Commands

### Docker

```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Enter a container
docker exec -it <container_name> /bin/sh
```

### Proxmox

```bash
# List all VMs
qm list

# Start a VM
qm start <vmid>

# Check VM status
qm status <vmid>
```

## Maintenance Checklist

- [ ] Weekly backup verification
- [ ] Monthly system updates
- [ ] Quarterly Docker image cleanup

## Important Notes

> **Important**: Always create a snapshot before performing any updates!

For detailed maintenance procedures, refer to the [Maintenance Guide](#maintenance).
