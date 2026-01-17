# Docker Development Guide

## Quick Reference

### Production Deployment
```bash
# Using Docker Compose (recommended)
docker compose up -d

# Using Docker directly
docker build -t liteda .
docker run -p 3000:3000 -v ./config:/app/config liteda
```

### Local Development with Hot Reload
```bash
# Use dev compose file
docker compose -f docker-compose.dev.yml up

# Access at http://localhost:5173
```

### Useful Commands
```bash
# View logs
docker logs liteda
docker logs -f liteda  # Follow

# Restart container
docker compose restart

# Rebuild after changes
docker compose up -d --build

# Stop and remove
docker compose down

# Check health
curl http://localhost:3000/health
```

## File Structure

```
.
├── Dockerfile                 # Production image
├── docker-compose.yml         # Production deployment
├── docker-compose.dev.yml     # Development with hot reload
├── docker-entrypoint.sh       # Startup script
├── .dockerignore             # Files to exclude from build
└── config.example/           # Default config template
```

## Building for Different Architectures

```bash
# Build for multiple platforms (requires buildx)
docker buildx build --platform linux/amd64,linux/arm64 -t liteda .
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `CONFIG_DIR` - Config directory path (default: /app/config)
- `AUTO_RELOAD` - Enable config hot reload (default: false)
- `NODE_ENV` - Node environment (default: production)

## Troubleshooting

### Permission Issues
```bash
# Fix config directory permissions
sudo chown -R $(id -u):$(id -g) config/

# Or use custom UID in docker-compose.yml
user: "${UID:-1000}:${GID:-1000}"
```

### Container Won't Start
```bash
# Check logs
docker logs liteda

# Check if port is in use
lsof -i :3000

# Remove and recreate
docker compose down
docker compose up -d
```

### Health Check Failing
```bash
# Test health endpoint
curl http://localhost:3000/health

# Enter container for debugging
docker exec -it liteda sh
```
