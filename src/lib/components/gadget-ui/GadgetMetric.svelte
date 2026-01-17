<script lang="ts">
	interface Props {
		value: string | number;
		label?: string;
		secondary?: string;
		highlight?: boolean;
		class?: string;
	}

	let { value, label, secondary, highlight = false, class: className = '' }: Props = $props();
</script>

<div class="flex flex-col gap-0.5 w-full {className}">
	<!-- Row 1: Primary value + label -->
	<div class="flex items-baseline gap-1 whitespace-nowrap overflow-hidden">
		<span class="font-medium {highlight ? 'text-destructive' : ''}">{value}</span>
		{#if label}
			<span class="text-xs sm:text-sm text-muted-foreground">{label}</span>
		{/if}
	</div>

	<!-- Row 2: Secondary info -->
	{#if secondary}
		<div class="flex items-baseline gap-1 whitespace-nowrap overflow-hidden text-ellipsis">
			<span class="text-xs sm:text-sm text-muted-foreground truncate">{secondary}</span>
		</div>
	{/if}
</div>
