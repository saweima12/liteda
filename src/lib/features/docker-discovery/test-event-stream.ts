#!/usr/bin/env bun
/**
 * Docker Event Stream Test Script
 *
 * This script demonstrates Docker event streaming by listening to Docker events
 * and logging them in real-time.
 *
 * Usage:
 *   bun run src/lib/features/docker-discovery/test-event-stream.ts
 *
 * To test:
 *   1. Run this script in one terminal
 *   2. In another terminal, run: docker run --rm alpine echo "test"
 *   3. You should see events logged in real-time
 *
 * Environment variables:
 *   DOCKER_SOCKET - Path to Docker socket (default: /var/run/docker.sock)
 *   DOCKER_HOST   - TCP endpoint (e.g., http://localhost:2375)
 */

import http from 'node:http';

// Configuration
const DOCKER_SOCKET = process.env.DOCKER_SOCKET || '/var/run/docker.sock';
const DOCKER_HOST = process.env.DOCKER_HOST;

// ANSI colors for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color: keyof typeof colors, prefix: string, ...args: unknown[]) {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
  console.log(`${colors.dim}[${timestamp}]${colors.reset} ${colors[color]}${prefix}${colors.reset}`, ...args);
}

interface DockerEvent {
  Type: string;
  Action: string;
  Actor: {
    ID: string;
    Attributes?: Record<string, string>;
  };
  time: number;
  timeNano: number;
}

function subscribeToDockerEvents() {
  log('blue', '🐳 Docker Event Stream Test');
  log('dim', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (DOCKER_HOST) {
    log('cyan', '📡 Connecting to:', DOCKER_HOST);
  } else {
    log('cyan', '📡 Connecting to:', DOCKER_SOCKET);
  }

  log('yellow', '⏳ Waiting for Docker events...');
  log('dim', '   (Try: docker run --rm alpine echo "test")');
  log('dim', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const path = '/events';
  let eventCount = 0;
  let startTime = Date.now();

  const onResponse = (res: http.IncomingMessage) => {
    log('green', '✓ Connected! Status:', res.statusCode);

    if (res.statusCode !== 200) {
      log('red', '✗ Error:', res.statusMessage);
      process.exit(1);
    }

    res.setEncoding('utf8');

    let buffer = '';
    res.on('data', (chunk: string) => {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const event: DockerEvent = JSON.parse(line);
          eventCount++;

          // Format event output
          const id = event.Actor.ID.slice(0, 12);
          const name = event.Actor.Attributes?.name || id;
          const eventType = event.Type.toUpperCase();
          const action = event.Action;

          // Color by event type
          let typeColor: keyof typeof colors = 'cyan';
          if (eventType === 'CONTAINER') typeColor = 'blue';
          else if (eventType === 'IMAGE') typeColor = 'magenta';
          else if (eventType === 'NETWORK') typeColor = 'yellow';
          else if (eventType === 'VOLUME') typeColor = 'green';

          // Action emoji
          let emoji = '•';
          if (action === 'start') emoji = '▶️ ';
          else if (action === 'stop') emoji = '⏸️ ';
          else if (action === 'create') emoji = '✨';
          else if (action === 'destroy') emoji = '💥';
          else if (action === 'die') emoji = '💀';
          else if (action === 'kill') emoji = '⚡';

          log(
            typeColor,
            `${emoji} Event #${eventCount}:`,
            `${eventType}/${action}`,
            `${colors.dim}→${colors.reset}`,
            name
          );

          // Show attributes if present
          if (event.Actor.Attributes && Object.keys(event.Actor.Attributes).length > 0) {
            const attrs = event.Actor.Attributes;
            const relevantAttrs: Record<string, string> = {};

            // Only show interesting attributes
            const interesting = ['image', 'name', 'signal', 'exitCode'];
            for (const key of interesting) {
              if (attrs[key]) {
                relevantAttrs[key] = attrs[key];
              }
            }

            if (Object.keys(relevantAttrs).length > 0) {
              log('dim', '     ', relevantAttrs);
            }
          }
        } catch (error) {
          log('red', '✗ Failed to parse event:', error);
          log('dim', '     Raw:', line.slice(0, 100));
        }
      }
    });

    res.on('end', () => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      log('yellow', '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('yellow', '📊 Stream ended');
      log('dim', `   Events received: ${eventCount}`);
      log('dim', `   Duration: ${duration}s`);
    });

    res.on('error', (error) => {
      log('red', '✗ Stream error:', error.message);
    });
  };

  // Create request
  let request: http.ClientRequest;

  if (DOCKER_HOST) {
    const url = new URL(DOCKER_HOST);
    request = http.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 2375,
        path,
        method: 'GET',
        headers: { Accept: 'application/json' },
      },
      onResponse
    );
  } else {
    request = http.request(
      {
        socketPath: DOCKER_SOCKET,
        path,
        method: 'GET',
        headers: { Accept: 'application/json' },
      },
      onResponse
    );
  }

  request.on('error', (error) => {
    log('red', '✗ Request error:', error.message);
    log('yellow', '\n💡 Troubleshooting:');
    log('dim', '   1. Check Docker is running: docker ps');
    log('dim', '   2. Check socket permissions: ls -l /var/run/docker.sock');
    log('dim', '   3. Try TCP: DOCKER_HOST=http://localhost:2375 bun run ...');
    process.exit(1);
  });

  request.end();

  // Graceful shutdown
  process.on('SIGINT', () => {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log('yellow', '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('yellow', '👋 Shutting down...');
    log('dim', `   Events received: ${eventCount}`);
    log('dim', `   Duration: ${duration}s`);
    log('green', '✓ Cleanup complete\n');
    request.destroy();
    process.exit(0);
  });
}

// Run the test
subscribeToDockerEvents();
