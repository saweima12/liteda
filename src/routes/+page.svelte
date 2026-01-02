<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import type { PageData } from './$types';
  import { ContentGroup, ThemeToggle, PageTabs, MarkdownContent } from '$components';
  import IconSettings from '~icons/lucide/settings';

  let { data }: { data: PageData } = $props();

  const settings = $derived(data.settings);
  const pagesList = $derived(data.pagesList);
  const pages = $derived(data.pages);
  const widgetIds = $derived(data.widgetIds);
  const defaultColumns = $derived(settings.layout?.columns ?? 3);

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
  <header class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold text-foreground">{settings.title}</h1>
    <div class="flex items-center gap-2">
      <ThemeToggle />
    </div>
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
      <MarkdownContent content={markdown} {blocks} {defaultColumns} pageId={currentPageId} {widgetIds} />
    </div>
  {/if}

  <!-- Services -->
  <main class="space-y-8">
    {#each services as group (group.name)}
      <ContentGroup {group} {defaultColumns} pageId={currentPageId} {widgetIds} />
    {/each}

    {#if services.length === 0 && !markdown}
      <div class="text-center py-16">
        <IconSettings class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 class="text-lg font-medium text-foreground mb-2">No content configured</h2>
        <p class="text-muted-foreground">
          Add content to your page configuration file
        </p>
      </div>
    {/if}
  </main>

  <!-- Footer -->
  <footer class="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
    <p>Liteda • Built with SvelteKit</p>
  </footer>
</div>