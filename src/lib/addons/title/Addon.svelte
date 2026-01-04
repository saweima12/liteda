<script lang="ts">
  import { getContext } from 'svelte';
  import type { Settings } from '$config';
  import type { AddonProps } from '../types';

  let { config }: AddonProps = $props();
  
  const settingsCtx = getContext<{ current: Settings }>('settings');
  const title = $derived(settingsCtx.current.title);
</script>

<h1 class="text-2xl font-bold text-foreground">
  {title}
</h1>
