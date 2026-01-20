# Docker Discovery Feature

Automatically discover and display Docker containers or Swarm services in your Liteda dashboard.

## Overview

The Docker Discovery feature connects to your Docker daemon and creates a custom service group displaying all your containers or Docker Swarm services. Items are automatically refreshed at a configurable interval.

## Features

- **Auto-discovery**: Automatically lists Docker containers or Swarm services
- **Docker Swarm support**: Automatic detection and service aggregation
- **Event streaming**: Real-time updates via Docker Events API (optional)
- **Label filtering**: Include or exclude items based on Docker labels
- **Real-time updates**: Configurable refresh interval with polling
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

      # Mode settings (new)
      mode: auto                         # Discovery mode: auto, container, or swarm
      enableEventStream: false           # Enable real-time event streaming (experimental)

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

## Docker Swarm Support

The feature automatically detects and supports Docker Swarm mode.

### Discovery Modes

Configure how the feature discovers containers/services:

```yaml
vars:
  mode: auto  # Options: auto, container, swarm
```

**Mode Options:**

- **`auto`** (default): Automatically detects Swarm mode and uses the appropriate API
  - If Swarm is active → Lists services (aggregated by service name)
  - If Swarm is inactive → Lists containers (traditional mode)

- **`container`**: Forces container mode even in Swarm environments
  - Shows individual container instances
  - Useful if you want to see all replicas separately

- **`swarm`**: Forces Swarm service mode
  - Only shows services (not individual containers)
  - Will fail if Swarm is not active

### Swarm vs Container Mode

| Feature | Container Mode | Swarm Mode |
|---------|---------------|------------|
| **Shows** | Individual containers | Services (aggregated) |
| **Replicas** | Each shown separately | Shown as count (e.g., 3/3) |
| **State** | `running`, `exited`, etc. | `running`, `partial`, `stopped` |
| **Best for** | Single-node Docker | Multi-node Swarm clusters |

### Example: Swarm Service Display

In Swarm mode, a service with 3 replicas appears as:

```
jellyfin
linuxserver/jellyfin:latest • 3/3 replicas
```

Instead of 3 separate containers:
```
jellyfin_1
jellyfin_2
jellyfin_3
```

### Swarm Label Filtering

Label filtering works the same in both modes, but checks different label locations:

- **Container mode**: Checks container labels
- **Swarm mode**: Checks service labels (from service spec)

Example Swarm service labels:

```bash
docker service create \
  --name jellyfin \
  --label app=media \
  --label env=production \
  linuxserver/jellyfin:latest
```

## Event Streaming (Experimental)

Enable real-time updates using Docker Events API instead of polling:

```yaml
vars:
  enableEventStream: true
  refreshInterval: 30000  # Fallback interval if events fail
```

### How It Works

When enabled:
- Opens a persistent connection to Docker Events API
- Listens for container/service lifecycle events (`start`, `stop`, `create`, `destroy`)
- Automatically refreshes the display when changes occur
- Falls back to polling if event stream fails

### Benefits

- **Instant updates**: No waiting for next poll interval
- **Reduced API calls**: Only queries when actual changes occur
- **Better resource usage**: No unnecessary API calls during idle periods

### Trade-offs

- **Experimental**: May have edge cases or connection issues
- **Persistent connection**: Keeps one HTTP connection open per feature instance
- **Fallback**: Still polls at `refreshInterval` if events fail

### When to Use

- ✅ Development environments with frequent container changes
- ✅ Small-scale production (1-10 services)
- ❌ Large-scale Swarm clusters (hundreds of services)
- ❌ Unreliable network connections

**Note:** Event streaming is disabled by default. Test thoroughly before enabling in production.

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
5. If using Swarm mode, check services: `docker service ls`

### Swarm Mode Not Detected

If you expect Swarm mode but it's showing containers:

1. Verify Swarm is initialized: `docker info | grep Swarm`
2. Check you're on a manager node (not worker)
3. Ensure `mode: auto` or `mode: swarm` in config
4. Check server logs for Swarm API errors

### Event Stream Not Working

If `enableEventStream: true` but updates aren't instant:

1. Check server logs for event stream errors
2. Verify Docker daemon allows event streaming
3. Try with `mode: container` (events work better with containers)
4. Ensure `refreshInterval` is set as fallback

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

## Testing

### Test Event Streaming

A test script is provided to verify Docker event streaming:

```bash
# Basic test
bun run src/lib/features/docker-discovery/test-event-stream.ts

# With custom Docker host
DOCKER_HOST=http://localhost:2375 bun run src/lib/features/docker-discovery/test-event-stream.ts
```

Generate test events in another terminal:
```bash
docker run --rm alpine echo "test"
```

Events will appear in real-time with color-coded output.

### Configuration Examples

See `example-config.yaml` for complete examples including:
- Basic container discovery
- Docker Swarm mode
- Event streaming
- Label filtering
- Remote Docker connections
- Portainer integration

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
