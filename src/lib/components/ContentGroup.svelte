<script lang="ts">
  import type { ServiceGroup as ServiceGroupType, InnerGroup } from '$config';
  import ServiceCard from './ServiceCard.svelte';
  import CompactCard from './CompactCard.svelte';
  import IconExternalLink from '~icons/lucide/external-link';
  import { getGroupRenderer, hasCustomRenderer } from '$lib/features/group-registry';

  interface Props {
    group: ServiceGroupType;
    defaultColumns?: number;
    pageId?: string;
    widgetIds?: Record<string, string>;
    statusIds?: Record<string, string>;
  }

  let { group, defaultColumns = 3, pageId = '', widgetIds = {}, statusIds = {} }: Props = $props();

  const hasCustom = $derived(hasCustomRenderer(group.type));
  const CustomRenderer = $derived(hasCustom ? getGroupRenderer(group.type) : null);

  // Unique identifier for this group instance (useful for custom renderers)
  const groupId = $derived(`${pageId}:${group.name}`);

  // Check if this is a nested group (has groups) or flat group (has items)
  const isNested = $derived(group.groups && group.groups.length > 0);
  const columns = $derived(group.columns ?? defaultColumns);
  const isBookmarks = $derived(group.type === 'bookmarks');
  const isCompact = $derived(group.type === 'compact');
  const equalHeight = $derived(group.equalHeight ?? true);
  const showName = $derived(group.showName ?? true);

  const gridCols: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  };

  function getIconUrl(icon: string | undefined): string | null {
    if (!icon) return null;
    if (icon.startsWith('http://') || icon.startsWith('https://')) return icon;
    if (icon.startsWith('/')) return icon;
    return `https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/${icon}.png`;
  }

  function isInnerBookmarks(inner: InnerGroup): boolean {
    return inner.type === 'bookmarks';
  }

  function isInnerCompact(inner: InnerGroup): boolean {
    return inner.type === 'compact';
  }

  function getWidgetId(groupName: string, itemName: string, innerGroupName?: string): string | undefined {
    const key = innerGroupName 
      ? `${pageId}:${groupName}:${innerGroupName}:${itemName}`
      : `${pageId}:${groupName}:${itemName}`;
    return widgetIds[key];
  }

  function getStatusCheckId(groupName: string, itemName: string, innerGroupName?: string): string | undefined {
    const key = innerGroupName 
      ? `${pageId}:${groupName}:${innerGroupName}:${itemName}`
      : `${pageId}:${groupName}:${itemName}`;
    return statusIds[key];
  }
</script>

{#if CustomRenderer}
  <CustomRenderer config={(group as unknown as { vars?: Record<string, unknown> }).vars || {}} {groupId} />
{:else if isNested}
  <!-- Nested group: outer group is a section header -->
  <section class="space-y-6">
    {#if showName}
      <h2 class="text-xl font-bold text-foreground flex items-center gap-2 pb-1">
        {#if group.icon}
          <img
            src={getIconUrl(group.icon)}
            alt=""
            class="w-6 h-6 object-contain"
            onerror={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        {/if}
        {group.name}
      </h2>
    {/if}

    <!-- Inner groups grid - columns controls how groups are arranged -->
    <div class="grid gap-6 {gridCols[columns] || gridCols[3]}">
      {#each group.groups as innerGroup (innerGroup.name)}
        {@const innerCols = innerGroup.columns ?? defaultColumns}
        {@const innerIsBookmarks = isInnerBookmarks(innerGroup)}
        {@const innerIsCompact = isInnerCompact(innerGroup)}
        {@const innerEqualHeight = innerGroup.equalHeight ?? true}
        {@const innerShowName = innerGroup.showName ?? true}
        
        <div class="space-y-4">
          {#if innerShowName}
            <h3 class="text-lg font-semibold text-foreground flex items-center gap-2">
              {#if innerGroup.icon}
                <img
                  src={getIconUrl(innerGroup.icon)}
                  alt=""
                  class="w-5 h-5 object-contain"
                  onerror={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              {/if}
              {innerGroup.name}
            </h3>
          {/if}

          {#if innerIsBookmarks}
            <div class="flex flex-wrap gap-2">
              {#each innerGroup.items as item (item.name)}
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm
                         bg-secondary text-secondary-foreground hover:bg-secondary/80
                         transition-colors"
                >
                  {#if item.icon}
                    {@const iconUrl = getIconUrl(item.icon)}
                    {#if iconUrl}
                      <img src={iconUrl} alt="" class="w-4 h-4 object-contain" onerror={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    {/if}
                  {/if}
                  {item.name}
                  <IconExternalLink class="h-3 w-3 opacity-50" />
                </a>
              {/each}
            </div>
          {:else if innerIsCompact}
            <div class="grid gap-3 {gridCols[innerCols] || gridCols[1]}">
              {#each innerGroup.items as item (item.name)}
                <CompactCard {item} />
              {/each}
            </div>
          {:else}
            <div class="grid gap-4 {innerEqualHeight ? 'items-stretch' : 'items-start'} {gridCols[innerCols] || gridCols[1]}">
              {#each innerGroup.items as service (service.name)}
                <ServiceCard {service} widgetId={getWidgetId(group.name, service.name, innerGroup.name)} statusCheckId={getStatusCheckId(group.name, service.name, innerGroup.name)} equalHeight={innerEqualHeight} />
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </section>
{:else}
  <!-- Flat group: original behavior -->
  <section class="space-y-4">
    {#if showName}
      <h2 class="text-lg font-semibold text-foreground flex items-center gap-2">
        {#if group.icon}
          <img
            src={getIconUrl(group.icon)}
            alt=""
            class="w-5 h-5 object-contain"
            onerror={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        {/if}
        {group.name}
      </h2>
    {/if}

    {#if isBookmarks}
      <div class="flex flex-wrap gap-2">
        {#each group.items ?? [] as item (item.name)}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm
                   bg-secondary text-secondary-foreground hover:bg-secondary/80
                   transition-colors"
          >
            {#if item.icon}
              {@const iconUrl = getIconUrl(item.icon)}
              {#if iconUrl}
                <img src={iconUrl} alt="" class="w-4 h-4 object-contain" onerror={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              {/if}
            {/if}
            {item.name}
            <IconExternalLink class="h-3 w-3 opacity-50" />
          </a>
        {/each}
      </div>
    {:else if isCompact}
      <div class="grid gap-3 {gridCols[columns] || gridCols[3]}">
        {#each group.items ?? [] as item (item.name)}
          <CompactCard {item} />
        {/each}
      </div>
    {:else}
      <div class="grid gap-4 {equalHeight ? 'items-stretch' : 'items-start'} {gridCols[columns] || gridCols[3]}">
        {#each group.items ?? [] as service (service.name)}
          <ServiceCard {service} widgetId={getWidgetId(group.name, service.name)} statusCheckId={getStatusCheckId(group.name, service.name)} {equalHeight} />
        {/each}
      </div>
    {/if}
  </section>
{/if}
