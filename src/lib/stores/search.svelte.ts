import type { ServiceItem, ServiceGroup, InnerGroup, Page, PageContent } from '$config';

/**
 * Represents a searchable service item
 */
export interface SearchItem {
	name: string;
	description?: string;
	icon?: string;
	url?: string;
	pageId: string;
	pageName: string;
	groupName: string;
}

// Svelte 5 runes state for search dialog
let open = $state(false);
let items = $state<SearchItem[]>([]);

/**
 * Search store for managing global search state
 */
export const searchStore = {
	get open() {
		return open;
	},
	set open(v: boolean) {
		open = v;
	},
	get items() {
		return items;
	},
	set items(v: SearchItem[]) {
		items = v;
	},
	toggle() {
		open = !open;
	},
	close() {
		open = false;
	},
};

/**
 * Build search index from pages data
 * Only indexes services (items with URLs)
 */
export function buildSearchIndex(
	pages: Record<string, PageContent>,
	pagesList: Page[]
): SearchItem[] {
	const result: SearchItem[] = [];

	for (const page of pagesList) {
		const content = pages[page.id];
		if (!content) continue;

		// Process service groups
		if (content.services) {
			for (const group of content.services) {
				processGroup(result, group, page);
			}
		}

	// Process markdown blocks
	if (content.blocks) {
		for (const [, block] of Object.entries(content.blocks)) {
			// Blocks can have either items (flat) or groups (nested)
			if (block.items) {
				for (const item of block.items) {
					if (item.url) {
						result.push(createSearchItem(item, page, block.name));
					}
				}
			}
			// Process nested groups in blocks
			if (block.groups) {
				for (const innerGroup of block.groups) {
					if (innerGroup.items) {
						for (const item of innerGroup.items) {
							if (item.url) {
								result.push(createSearchItem(item, page, `${block.name} > ${innerGroup.name}`));
							}
						}
					}
				}
			}
		}
	}
	}

	return result;
}

/**
 * Process a service group and extract services
 */
function processGroup(
	result: SearchItem[],
	group: ServiceGroup,
	page: Page
): void {
	// Process nested inner groups
	if (group.groups) {
		for (const innerGroup of group.groups) {
			processInnerGroup(result, innerGroup, page, innerGroup.name);
		}
	}

	// Process direct items
	if (group.items) {
		for (const item of group.items) {
			if (item.url) {
				result.push(createSearchItem(item, page, group.name));
			}
		}
	}
}

/**
 * Process an inner group
 */
function processInnerGroup(
	result: SearchItem[],
	group: InnerGroup,
	page: Page,
	groupName: string
): void {
	for (const item of group.items) {
		if (item.url) {
			result.push(createSearchItem(item, page, groupName));
		}
	}
}

/**
 * Create a SearchItem from a ServiceItem
 */
function createSearchItem(item: ServiceItem, page: Page, groupName: string): SearchItem {
	return {
		name: item.name,
		description: item.description,
		icon: item.icon,
		url: item.url,
		pageId: page.id,
		pageName: page.name,
		groupName,
	};
}
