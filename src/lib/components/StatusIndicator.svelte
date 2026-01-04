<script lang="ts">
  import type { ServiceStatus } from '$lib/widgets/types';

  interface Props {
    // Direct status (from widget)
    status?: ServiceStatus;
    latency?: number | null;
    // Or fetch from API (for standalone status check)
    checkId?: string;
    interval?: number;
  }

  let { status, latency, checkId, interval = 60000 }: Props = $props();

  // Local state for standalone status check
  let localStatus = $state<ServiceStatus>('unknown');
  let localLatency = $state<number | null>(null);
  let lastChecked = $state<Date | null>(null);

  // Use provided status or local status
  const displayStatus = $derived(status ?? localStatus);
  const displayLatency = $derived(latency ?? localLatency);

  // Fetch status if checkId is provided
  async function fetchStatus() {
    if (!checkId) return;

    try {
      const res = await fetch(`/api/status-check?id=${encodeURIComponent(checkId)}`);
      if (res.ok) {
        const data = await res.json();
        localStatus = data.status;
        localLatency = data.latency;
        lastChecked = new Date(data.checkedAt);
      } else {
        localStatus = 'offline';
      }
    } catch {
      localStatus = 'offline';
    }
  }

  // Auto-fetch for standalone mode
  $effect(() => {
    if (checkId) {
      fetchStatus();
      const id = setInterval(fetchStatus, interval);
      return () => clearInterval(id);
    }
  });

  // Status colors
  const statusColors: Record<ServiceStatus, string> = {
    online: 'bg-green-500',
    offline: 'bg-red-500',
    unknown: 'bg-gray-400',
  };

  // Tooltip text
  const tooltipText = $derived(() => {
    const statusLabel = displayStatus === 'online' ? 'Online' : displayStatus === 'offline' ? 'Offline' : 'Unknown';
    const latencyText = displayLatency !== null ? ` · ${displayLatency}ms` : '';
    const timeText = lastChecked ? ` · ${formatTimeAgo(lastChecked)}` : '';
    return `${statusLabel}${latencyText}${timeText}`;
  });

  function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  }
</script>

<div
  class="w-2.5 h-2.5 rounded-full {statusColors[displayStatus]} shadow-sm"
  title={tooltipText()}
></div>
