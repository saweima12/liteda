<script lang="ts">
	interface Props {
		value: number; // 0-100
		highlight?: boolean;
		class?: string;
	}

	let { value, highlight = false, class: className = '' }: Props = $props();
</script>

<div class="h-1 w-full bg-muted rounded-full overflow-hidden {className}">
	<div
		class="h-full transition-all duration-300 {highlight ? 'bg-destructive' : 'bg-primary'}"
		style="width: {Math.min(Math.max(value, 0), 100)}%"
	></div>
</div>
