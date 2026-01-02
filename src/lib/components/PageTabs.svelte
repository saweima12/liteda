<script lang="ts">
  import type { Component } from 'svelte';
  import type { Page } from '$config';
  import IconHome from '~icons/lucide/home';
  import IconPlay from '~icons/lucide/play';
  import IconServer from '~icons/lucide/server';
  import IconSettings from '~icons/lucide/settings';
  import IconFolder from '~icons/lucide/folder';
  import IconMonitor from '~icons/lucide/monitor';
  import IconDatabase from '~icons/lucide/database';
  import IconCloud from '~icons/lucide/cloud';

  interface Props {
    pages: Page[];
    currentPageId: string;
    onPageChange: (id: string) => void;
  }

  let { pages, currentPageId, onPageChange }: Props = $props();

  // Map icon names to components
  const iconMap: Record<string, Component> = {
    home: IconHome,
    play: IconPlay,
    server: IconServer,
    settings: IconSettings,
    folder: IconFolder,
    monitor: IconMonitor,
    database: IconDatabase,
    cloud: IconCloud,
  };

  function getIcon(iconName?: string) {
    if (!iconName) return IconHome;
    return iconMap[iconName.toLowerCase()] || IconFolder;
  }
</script>

{#if pages.length > 1}
  <nav class="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg mb-6">
    {#each pages as page (page.id)}
      {@const Icon = getIcon(page.icon)}
      <button
        onclick={() => onPageChange(page.id)}
        class="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
               {currentPageId === page.id 
                 ? 'bg-background text-foreground shadow-sm' 
                 : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}"
      >
        <Icon class="h-4 w-4" />
        {page.name}
      </button>
    {/each}
  </nav>
{/if}
