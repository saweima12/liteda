<script lang="ts">
  import { Card } from './ui';
  import ContentGroup from './ContentGroup.svelte';
  import type { BlockDefinition } from '$config';

  interface Props {
    content: string;
    blocks?: Record<string, BlockDefinition>;
    defaultColumns?: number;
    pageId?: string;
    widgetIds?: Record<string, string>;
    statusIds?: Record<string, string>;
  }

  let { content, blocks = {}, defaultColumns = 3, pageId = '', widgetIds = {}, statusIds = {} }: Props = $props();

  // Parse content, separate HTML and block placeholders
  interface ContentPart {
    type: 'html' | 'block';
    value: string;
  }

  const parts = $derived.by(() => {
    const result: ContentPart[] = [];
    // Match <div data-block="xxx"></div> or wrapped in <p> tags
    const regex = /(?:<p>)?<div data-block="(\w+)"><\/div>(?:<\/p>)?/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      // Add HTML before the match
      if (match.index > lastIndex) {
        const html = content.slice(lastIndex, match.index).trim();
        if (html) {
          result.push({ type: 'html', value: html });
        }
      }
      // Add block placeholder
      result.push({ type: 'block', value: match[1] });
      lastIndex = regex.lastIndex;
    }

    // Add remaining HTML
    if (lastIndex < content.length) {
      const html = content.slice(lastIndex).trim();
      if (html) {
        result.push({ type: 'html', value: html });
      }
    }

    return result;
  });

  // Generate widgetIds scoped to block, rewriting keys for ContentGroup
  // ContentGroup expects: {pageId}:{groupName}:{itemName} or {pageId}:{groupName}:{innerGroupName}:{itemName}
  // extractWidgets generates: {pageId}:block:{blockId}:{itemName} or {pageId}:block:{blockId}:{innerGroupName}:{itemName}
  function getBlockWidgetIds(blockId: string, blockName: string): Record<string, string> {
    const oldPrefix = `${pageId}:block:${blockId}:`;
    const newPrefix = `${pageId}:block:${blockId}:${blockName}:`;
    const result: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(widgetIds)) {
      if (key.startsWith(oldPrefix)) {
        // Rewrite key: add blockName after blockId
        // Old: "notes:block:tools:Portainer"
        // New: "notes:block:tools:Infrastructure Services:Portainer"
        const suffix = key.substring(oldPrefix.length);
        const newKey = newPrefix + suffix;
        result[newKey] = value;
      }
    }
    return result;
  }
</script>

<div class="space-y-6">
  {#each parts as part, i (i)}
    {#if part.type === 'html'}
      <Card class="p-6 prose dark:prose-invert max-w-none">
        {@html part.value}
      </Card>
    {:else if part.type === 'block' && blocks[part.value]}
      {@const block = blocks[part.value]}
      {@const blockPrefix = `${pageId}:block:${part.value}`}
      <ContentGroup 
        group={{ 
          name: block.name, 
          type: block.type,
          icon: (block as any).icon,
          columns: block.columns,
          items: block.items || [],
          groups: (block as any).groups,
          equalHeight: (block as any).equalHeight,
          showName: (block as any).showName
        }} 
        {defaultColumns}
        pageId={blockPrefix}
        widgetIds={getBlockWidgetIds(part.value, block.name)}
      />
    {:else if part.type === 'block'}
      <Card class="p-4 border-warning/50 bg-warning/10">
        <p class="text-sm text-warning">Block not found: {part.value}</p>
      </Card>
    {/if}
  {/each}
</div>
