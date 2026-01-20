<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import * as Command from '$lib/components/ui/command';
	import { searchStore, type SearchItem } from '$lib/stores/search.svelte';
	import { t } from '$lib/i18n';
	import IconExternalLink from '~icons/lucide/external-link';
	import { getIconUrl } from '$lib/utils/icons';

	interface Props {
		onSelect?: (item: SearchItem) => void;
	}

	let { onSelect }: Props = $props();

	// Group items by page
	const groupedItems = $derived.by(() => {
		const groups = new Map<string, SearchItem[]>();
		for (const item of searchStore.items) {
			const key = item.pageName;
			if (!groups.has(key)) groups.set(key, []);
			groups.get(key)!.push(item);
		}
		return groups;
	});

	function handleSelect(item: SearchItem) {
		searchStore.close();
		onSelect?.(item);
	}

	// Global keyboard shortcut
	onMount(() => {
		if (!browser) return;

		function handleKeydown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				searchStore.toggle();
			}
		}

		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});
</script>

<Command.Dialog
	open={searchStore.open}
	onOpenChange={(v) => (searchStore.open = v)}
>
	<Command.Input placeholder={$t('common.search.placeholder')} />
	<Command.List>
		<Command.Empty>{$t('common.search.no_results')}</Command.Empty>

		{#each [...groupedItems] as [pageName, items] (pageName)}
			<Command.Group heading={pageName}>
				{#each items as item (item.name + item.pageId + item.groupName)}
					<Command.Item
						value={`${item.name} ${item.description ?? ''} ${item.groupName}`}
						onSelect={() => handleSelect(item)}
					>
						<!-- Icon -->
						{#if item.icon}
							{@const iconUrl = getIconUrl(item.icon)}
							{#if iconUrl}
								<img src={iconUrl} alt="" class="size-4 object-contain" />
							{/if}
						{/if}

						<div class="flex-1 min-w-0">
							<span>{item.name}</span>
							{#if item.description}
								<span class="text-muted-foreground text-xs ml-2">{item.description}</span>
							{/if}
						</div>

						<IconExternalLink class="size-3 text-muted-foreground flex-shrink-0" />
					</Command.Item>
				{/each}
			</Command.Group>
		{/each}
	</Command.List>
</Command.Dialog>
