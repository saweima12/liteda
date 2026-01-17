<script lang="ts">
	interface Props {
		loading?: boolean;
		error?: string | null;
		class?: string;
	}

	let { loading = false, error = null, class: className = '' }: Props = $props();
</script>

{#if loading}
	<span class="text-muted-foreground text-xs sm:text-sm {className}">Loading...</span>
{:else if error}
	<span class="text-destructive text-xs sm:text-sm {className}">{error}</span>
{/if}
