<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { searchStore } from '$lib/stores/search.svelte';
	import type { GadgetProps } from '../types';
	import IconSearch from '~icons/lucide/search';

	let { config }: GadgetProps = $props();

	let isMac = $state(false);

	onMount(() => {
		if (browser) {
			isMac = /Mac|iPhone|iPod|iPad/i.test(navigator.platform) ||
			        /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent);
		}
	});
</script>

<button
	type="button"
	onclick={() => (searchStore.open = true)}
	class="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 hover:bg-muted border border-border rounded-md transition-colors"
>
	<IconSearch class="h-4 w-4" />
	<span class="hidden sm:inline">Search</span>
	<kbd class="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-background rounded border border-border">
		{#if isMac}
			<span>⌘</span>K
		{:else}
			<span>Ctrl</span>K
		{/if}
	</kbd>
</button>
