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

<div class="flex items-start gap-2 {className}">
	{#if Icon}
		<Icon class="h-4 w-4 flex-shrink-0 mt-0.5 {iconClass}" />
	{/if}
	<div class="w-[140px] sm:w-auto md:w-[120px]">
		{#if children}
			{@render children()}
		{/if}
	</div>
</div>
