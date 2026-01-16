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
  <nav class="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg mb-6 overflow-x-auto scrollbar-hide">
    {#each pages as page (page.id)}
      {@const Icon = getIcon(page.icon)}
      <button
        onclick={() => onPageChange(page.id)}
        class="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0
               {currentPageId === page.id
                 ? 'bg-background text-foreground shadow-sm'
                 : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}"
      >
        <Icon class="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
        <span class="hidden sm:inline">{page.name}</span>
      </button>
    {/each}
  </nav>
{/if}

<style>
  /* Hide scrollbar but keep functionality */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
</style>
