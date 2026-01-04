<script lang="ts">
  import { toggleMode, mode } from 'mode-watcher';
  import { Button } from '$components/ui';
  import type { AddonProps } from '../types';
  import IconSun from '~icons/lucide/sun';
  import IconMoon from '~icons/lucide/moon';

  let { config }: AddonProps = $props();
</script>

<Button variant="ghost" size="icon" onclick={toggleMode}>
  {#if $mode === 'dark'}
    <IconSun class="h-5 w-5" />
  {:else}
    <IconMoon class="h-5 w-5" />
  {/if}
  <span class="sr-only">Toggle theme</span>
</Button>
