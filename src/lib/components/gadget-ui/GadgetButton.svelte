<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		onclick?: () => void;
		children?: Snippet;
	}

	let { class: className = '', onclick, children }: Props = $props();
</script>

<button
	{onclick}
	class="inline-flex items-center gap-1.5 sm:gap-2 rounded-md px-2 py-1.5 text-xs sm:text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring {className}"
>
	{#if children}
		{@render children()}
	{/if}
</button>
