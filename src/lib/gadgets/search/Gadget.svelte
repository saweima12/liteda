<script lang="ts">
	import { searchStore } from '$lib/stores/search.svelte';
	import type { GadgetProps } from '../types';
	import IconSearch from '~icons/lucide/search';

	let { config }: GadgetProps = $props();
</script>

<button
	type="button"
	onclick={() => (searchStore.open = true)}
	class="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 hover:bg-muted border border-border rounded-md transition-colors"
>
	<IconSearch class="h-4 w-4" />
	<span class="hidden sm:inline">Search</span>
	<kbd class="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-background rounded border border-border">
		<span>⌘</span>K
	</kbd>
</button>
