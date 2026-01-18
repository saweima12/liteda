export function createFeatureGroupId(pageId: string, groupName: string): string {
  const normalizedPageId = pageId.trim().toLowerCase();
  const normalizedGroupName = groupName
    .trim()
    .toLowerCase()
    .replace(/[\s:/]+/g, '-')
    .replace(/-+/g, '-');

  return `${normalizedPageId}:${normalizedGroupName}`;
}
