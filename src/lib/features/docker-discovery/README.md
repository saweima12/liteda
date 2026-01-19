# Docker Discovery Feature

Automatically discover and display Docker containers in your Liteda dashboard.

## Overview

The Docker Discovery feature connects to your Docker daemon and creates a custom service group displaying all your containers. Containers are automatically refreshed at a configurable interval.

## Features

- **Auto-discovery**: Automatically lists all Docker containers
- **Label filtering**: Include or exclude containers based on Docker labels
- **Real-time updates**: Configurable refresh interval
- **Flexible layout**: Customizable grid columns (1-6)
- **URL templates**: Generate links to container management UIs
- **Caching**: Server-side caching to reduce Docker API calls

## Configuration

Enable the feature in `config/settings.yaml`:

```yaml
features:
  docker-discovery:
    enabled: true
    vars:
      # Docker connection settings
      socketPath: /var/run/docker.sock  # Default Unix socket
      # endpoint: http://localhost:2375  # Alternative: TCP endpoint
      # headers:                          # Optional custom headers
      #   X-Custom-Header: value
      # tls:                              # Optional TLS configuration
      #   ca: /path/to/ca.pem
      #   cert: /path/to/cert.pem
      #   key: /path/to/key.pem

      # Display settings
      targetPages: [home]                # Pages to add the Docker group to
      groupName: Docker Containers       # Group heading
      groupIcon: docker                  # Icon name
      refreshInterval: 30000             # Refresh interval in ms (30s)
      columns: 3                         # Grid columns (1-6)

      # Label filtering (optional)
      # includeLabels:                   # Only show containers with these labels
      #   - app                          # Matches any container with "app" label
      #   - env=production               # Matches containers with "env=production"
      # excludeLabels:                   # Hide containers with these labels
      #   - internal                     # Hides containers with "internal" label
      #   - hidden=true                  # Hides containers with "hidden=true"

      # URL template (optional)
      urlTemplate: http://localhost:9000/#!/1/docker/containers/{id}
      # Available placeholders:
      #   {name}  - Container name
      #   {id}    - Container ID
      #   {image} - Container image
      #   {state} - Container state (running, exited, etc.)
```

## Connection Methods

**Support policy:** This feature talks to the Docker Engine API over a Unix socket or a TCP/HTTPS endpoint.
SSH-based Docker connections are intentionally not supported.

### Unix Socket (Default)

```yaml
vars:
  socketPath: /var/run/docker.sock
```

When running in Docker, mount the socket:

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro
```

### TCP Endpoint

```yaml
vars:
  endpoint: http://docker-host:2375
```

### TCP with TLS

```yaml
vars:
  endpoint: https://docker-host:2376
  tls:
    ca: /app/certs/ca.pem
    cert: /app/certs/cert.pem
    key: /app/certs/key.pem
```

## Label Filtering

Filter which containers appear in your dashboard using Docker labels.

### Include Labels

Only show containers that have **at least one** of the specified labels:

```yaml
vars:
  includeLabels:
    - app                    # Show containers with "app" label
    - env=production         # Show containers with "env=production"
    - traefik.enable=true    # Show Traefik-enabled containers
```

### Exclude Labels

Hide containers that have **any** of the specified labels:

```yaml
vars:
  excludeLabels:
    - internal               # Hide containers with "internal" label
    - hidden=true            # Hide containers with "hidden=true"
```

### Combined Filtering

You can use both include and exclude filters together:

```yaml
vars:
  includeLabels:
    - app                    # Start with containers that have "app" label
  excludeLabels:
    - env=staging            # But exclude staging containers
```

**Filter logic:**
1. Exclude filters are applied first (if any match, container is hidden)
2. Include filters are applied second (if specified, at least one must match)
3. If only exclude filters are specified, all containers are shown except excluded ones

### Label Format

Labels can be specified in two formats:

- **Key-only**: `app` - Matches if the label key exists (any value)
- **Key-value**: `app=nginx` - Matches if the label key exists AND value matches exactly

## URL Templates

Generate clickable links for each container using URL templates. Common examples:

### Portainer

```yaml
urlTemplate: http://localhost:9000/#!/1/docker/containers/{id}
```

### Docker Desktop

```yaml
urlTemplate: docker://container/{name}
```

### Custom Dashboard

```yaml
urlTemplate: https://dashboard.example.com/containers/{name}?state={state}
```

## Multiple Pages

Display Docker containers on multiple pages:

```yaml
vars:
  targetPages:
    - home
    - infrastructure
    - services
```

A Docker group will be added to each specified page.

## Performance

The feature includes several optimizations:

- **Server-side caching**: Container list is cached based on `refreshInterval`
- **Thundering herd prevention**: Concurrent requests share the same fetch
- **Lazy loading**: Feature code is only loaded when enabled
- **LRU cache**: Automatic cleanup of old cache entries

Cache TTL is automatically set to match `refreshInterval` to prevent stale data.

## Troubleshooting

### Permission Denied

If you get permission errors accessing the Docker socket:

**In Docker:**
```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro
user: "0:0"  # Run as root (or add user to docker group)
```

**In Kubernetes:**
```yaml
securityContext:
  runAsUser: 0
  runAsGroup: 0
```

### Connection Refused

If using TCP endpoint:

1. Ensure Docker daemon is listening on TCP:
   ```bash
   dockerd -H unix:///var/run/docker.sock -H tcp://0.0.0.0:2375
   ```

2. Check firewall rules allow the connection

3. Verify the endpoint URL is correct

### No Containers Shown

1. Check label filters - they might be excluding all containers
2. Verify Docker has running containers: `docker ps -a`
3. Check browser console for errors
4. Check server logs for Docker API errors

## Architecture

### Server Startup

1. Feature is loaded via `src/lib/features/loader.ts`
2. `index.ts` `init()` is called with config vars
3. Docker client is initialized with connection settings
4. Service group is injected into specified pages

### Runtime

1. `DockerGroup.svelte` renders on the page
2. Component fetches from `/api/features/docker-discovery`
3. Handler queries Docker API with caching
4. Containers are filtered by labels
5. Data is returned to component and displayed

### Cleanup

1. On server shutdown (SIGINT/SIGTERM)
2. Feature `destroy()` is called
3. Docker client is closed

## Development

See `src/lib/features/_template/README.md` for the general feature development guide.

### Files

```
src/lib/features/docker-discovery/
├── index.ts              # Feature implementation
├── meta.ts               # Zod schemas and metadata
├── types.ts              # TypeScript types
├── docker-client.ts      # Docker connection management
├── handler.ts            # GET /api/features/docker-discovery
├── utils.ts              # Container mapping and filtering
├── components/
│   └── DockerGroup.svelte  # UI component
└── README.md             # This file
```

### Adding to Registry

Already registered in `src/lib/features/loader.ts`:

```typescript
const FEATURES_REGISTRY = {
  'docker-discovery': () => import('./docker-discovery'),
};
```

Renderer registered in `src/lib/features/renderer-registry.ts`:

```typescript
registerGroupRendererRegistrar(() => {
  registerGroupRenderer('docker-group', DockerGroup);
});
```
