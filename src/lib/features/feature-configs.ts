import type { PageContent, ServiceGroup } from '$config';
import type { FeatureGroupConfig } from './config-store';
import { createFeatureGroupId } from './group-id';

export function buildFeatureConfigs(pagesContent: Map<string, PageContent>): Map<string, FeatureGroupConfig> {
  const configs = new Map<string, FeatureGroupConfig>();

  for (const [pageId, content] of pagesContent.entries()) {
    for (const group of content.services) {
      addGroupConfig(configs, pageId, group);
    }

    if (content.blocks) {
      for (const [blockId, block] of Object.entries(content.blocks)) {
        addBlockConfig(configs, pageId, blockId, block);
      }
    }
  }

  return configs;
}

function addGroupConfig(
  configs: Map<string, FeatureGroupConfig>,
  pageId: string,
  group: ServiceGroup
) {
  const groupId = createFeatureGroupId(pageId, group.name);

  if (isCustomGroup(group)) {
    configs.set(groupId, {
      type: group.type ?? 'services',
      vars: group.vars,
    });
  }
}

function addBlockConfig(
  configs: Map<string, FeatureGroupConfig>,
  pageId: string,
  blockId: string,
  block: ServiceGroup
) {
  const groupId = createFeatureGroupId(`${pageId}:block:${blockId}`, block.name);

  if (isCustomGroup(block)) {
    configs.set(groupId, {
      type: block.type ?? 'services',
      vars: block.vars,
    });
  }
}

function isCustomGroup(group: ServiceGroup): boolean {
  return group.type !== 'services' && group.type !== 'bookmarks' && group.type !== 'compact';
}
