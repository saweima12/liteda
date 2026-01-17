<script lang="ts">
	import type { Component } from 'svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		icon?: Component;
		iconClass?: string;
		children?: Snippet;
		class?: string;
	}

	let { icon: Icon, iconClass = '', children, class: className = '' }: Props = $props();
</script>

<div class="flex items-start gap-2 min-w-[140px] sm:min-w-0 {className}">
	{#if Icon}
		<Icon class="h-4 w-4 flex-shrink-0 mt-0.5 {iconClass}" />
	{/if}
	<div class="flex-1 min-w-0">
		{#if children}
			{@render children()}
		{/if}
	</div>
</div>
