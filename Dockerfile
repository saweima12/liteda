# Build stage
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# For local development with live reload, you can use:
# docker run -v ./src:/app/src -v ./config:/app/config liteda bun dev

# Copy source code
COPY . .

# Build application
RUN bun run build

# Production stage
FROM oven/bun:1-alpine AS runner

WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Create non-root user with UID 1000 (most common)
RUN addgroup -g 1000 liteda && \
    adduser -D -u 1000 -G liteda liteda

# Copy built files from builder
COPY --from=builder --chown=liteda:liteda /app/build ./build
COPY --from=builder --chown=liteda:liteda /app/node_modules ./node_modules
COPY --from=builder --chown=liteda:liteda /app/package.json ./

# Copy example config
COPY --chown=liteda:liteda config.example /app/config-example

# Copy entrypoint script
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/

# Create config directory (will be mounted)
RUN mkdir -p /app/config && chown liteda:liteda /app/config

# Switch to non-root user
USER liteda

# Environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    CONFIG_DIR=/app/config \
    AUTO_RELOAD=false

# Expose port
EXPOSE 3000

# Health check using dedicated endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Use entrypoint for initialization
ENTRYPOINT ["docker-entrypoint.sh"]

# Start application
CMD ["bun", "run", "build/index.js"]
