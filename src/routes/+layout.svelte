<script lang="ts">
  import '../app.css';
  import { ModeWatcher } from 'mode-watcher';
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  import type { LayoutData } from './$types';

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
</script>

<ModeWatcher defaultMode="dark" />

<div class="min-h-screen bg-pattern">
  {@render children()}
</div>
