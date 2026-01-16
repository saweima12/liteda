<script lang="ts">
  import { onMount, setContext } from 'svelte';
  import { browser } from '$app/environment';
  import type { PageData } from './$types';
  import { ContentGroup, PageTabs, MarkdownContent, Bar } from '$components';
  import IconSettings from '~icons/lucide/settings';
  import { t } from '$lib/i18n';
  import { searchStore, buildSearchIndex } from '$lib/stores/search.svelte';

  let { data }: { data: PageData } = $props();

  const settings = $derived(data.settings);
  const pagesList = $derived(data.pagesList);
  const pages = $derived(data.pages);
  const widgetIds = $derived(data.widgetIds);
  const statusIds = $derived(data.statusIds);
  const addonIds = $derived(data.addonIds ?? []);
  const defaultColumns = $derived(settings.layout?.columns ?? 3);
  const headerItems = $derived(settings.layout?.header);

  // Provide settings to child components (for addons like title)
  // Using a getter so derived value stays reactive
  setContext('settings', {
    get current() { return settings; }
  });

  // Build search index when data is available
  $effect(() => {
    if (browser && pages && pagesList) {
      searchStore.items = buildSearchIndex(pages, pagesList);
    }
  });

  // Default header if not configured
  const defaultRightHeader = [
    { type: 'spacer' },
    { type: 'theme-switcher' },
  ];

  // Current page state (from hash)
  let currentPageId = $state('home');
  $effect(() => {
    if (!currentPageId && pagesList.length > 0 ) {
      currentPageId = pagesList[0].id;
    }
  })

  // Current page content
  const currentContent = $derived(pages[currentPageId] || { services: [] });
  const services = $derived(currentContent.services);
  const markdown = $derived(currentContent.markdown);
  const blocks = $derived(currentContent.blocks);

  // Handle hash changes
  function updatePageFromHash() {
    if (!browser) return;
    const hash = window.location.hash.slice(1); // Remove #
    if (hash && pages[hash]) {
      currentPageId = hash;
    } else if (pagesList.length > 0) {
      currentPageId = pagesList[0].id;
    }
  }

  function handlePageChange(id: string) {
    currentPageId = id;
    if (browser) {
      window.location.hash = id;
    }
  }

  onMount(() => {
    updatePageFromHash();
    window.addEventListener('hashchange', updatePageFromHash);
    return () => window.removeEventListener('hashchange', updatePageFromHash);
  });
</script>

<svelte:head>
  <title>{settings.title}</title>
  {#if settings.favicon}
    <link rel="icon" href={settings.favicon} />
  {/if}
</svelte:head>

<!-- Background -->
{#if settings.background?.image}
  <div
    class="fixed inset-0 -z-10 bg-cover bg-center"
    style="
      background-image: url({settings.background.image});
      opacity: {settings.background.opacity ?? 0.5};
      filter: blur({settings.background.blur ?? 0}px);
    "
  ></div>
{/if}

<div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
  <!-- Header -->
  <header class="mb-6">
    <Bar items={headerItems ?? defaultRightHeader} ids={addonIds} />
  </header>

  <!-- Page Tabs -->
  <PageTabs 
    pages={pagesList} 
    {currentPageId} 
    onPageChange={handlePageChange} 
  />

  <!-- Markdown Content -->
  {#if markdown}
    <div class="mb-8">
      <MarkdownContent content={markdown} {blocks} {defaultColumns} pageId={currentPageId} {widgetIds} {statusIds} />
    </div>
  {/if}

  <!-- Services -->
  <main class="space-y-8">
    {#each services as group (group.name)}
      <ContentGroup {group} {defaultColumns} pageId={currentPageId} {widgetIds} {statusIds} />
    {/each}

    {#if services.length === 0 && !markdown}
      <div class="text-center py-16">
        <IconSettings class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 class="text-lg font-medium text-foreground mb-2">{$t('common.empty.no_content')}</h2>
        <p class="text-muted-foreground">
          {$t('common.empty.add_content')}
        </p>
      </div>
    {/if}
  </main>

  <!-- Footer -->
  <footer class="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
    <p>{$t('common.footer')}</p>
  </footer>
</div>