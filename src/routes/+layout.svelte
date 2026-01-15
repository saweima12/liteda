<script lang="ts">
  import '../app.css';
  import { ModeWatcher } from 'mode-watcher';
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  import type { LayoutData } from './$types';
  import SearchDialog from '$lib/components/SearchDialog.svelte';
  import type { SearchItem } from '$lib/stores/search.svelte';

  interface Props {
    children: Snippet;
    data: LayoutData;
  }

  let { children, data }: Props = $props();

  onMount(() => {
    // Inject custom CSS if provided
    if (data.customCss) {
      const style = document.createElement('style');
      style.id = 'custom-css';
      style.textContent = data.customCss;
      document.head.appendChild(style);

      return () => {
        style.remove();
      };
    }
  });

  function handleSearchSelect(item: SearchItem) {
    if (item.url) {
      // Open service URL in new tab
      window.open(item.url, '_blank');
    }
  }
</script>

<ModeWatcher defaultMode="dark" />
<SearchDialog onSelect={handleSearchSelect} />

<div class="min-h-screen bg-pattern">
  {@render children()}
</div>
