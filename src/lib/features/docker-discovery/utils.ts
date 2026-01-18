import type { DockerContainer } from './types';

export function normalizeContainerName(name: string): string {
  return name.replace(/^\//, '');
}

export function mapContainers(
  containers: Array<{
    Id: string;
    Names?: string[];
    Image: string;
    State: string;
    Status: string;
    Ports: Array<{ PrivatePort: number; PublicPort?: number; Type: string }>;
  }>
): DockerContainer[] {
  return containers.map((container) => ({
    id: container.Id,
    name: normalizeContainerName(container.Names?.[0] ?? container.Id.slice(0, 12)),
    image: container.Image,
    state: container.State as DockerContainer['state'],
    status: container.Status,
    ports: container.Ports.map((port) => ({
      private: port.PrivatePort,
      public: port.PublicPort,
      type: port.Type,
    })),
  }));
}

/**
 * Filter containers by labels
 *
 * @param containers - Mapped container data
 * @param rawContainers - Raw Docker API response (contains Labels)
 * @param options - Filter options
 * @returns Filtered containers
 */
export function filterByLabels(
  containers: DockerContainer[],
  rawContainers: Array<{ Id: string; Labels?: Record<string, string> }>,
  options: {
    includeLabels?: string[];
    excludeLabels?: string[];
  }
): DockerContainer[] {
  const { includeLabels, excludeLabels } = options;

  // If no filters, return all
  if (!includeLabels && !excludeLabels) {
    return containers;
  }

  // Create a map of container ID to labels for quick lookup
  const labelsMap = new Map<string, Record<string, string>>();
  for (const raw of rawContainers) {
    labelsMap.set(raw.Id, raw.Labels || {});
  }

  return containers.filter((container) => {
    const labels = labelsMap.get(container.id) || {};

    // Exclude filter: if any exclude label matches, skip this container
    if (excludeLabels && excludeLabels.length > 0) {
      for (const excludeLabel of excludeLabels) {
        if (hasLabel(labels, excludeLabel)) {
          return false;
        }
      }
    }

    // Include filter: if specified, container must have at least one include label
    if (includeLabels && includeLabels.length > 0) {
      return includeLabels.some((includeLabel) => hasLabel(labels, includeLabel));
    }

    // If only exclude filters were specified and we got here, include the container
    return true;
  });
}

/**
 * Check if a label exists in the labels object
 * Supports both key-only and key=value formats
 *
 * @param labels - Container labels
 * @param labelPattern - Label pattern (e.g., "app" or "app=nginx")
 * @returns True if label matches
 */
function hasLabel(labels: Record<string, string>, labelPattern: string): boolean {
  const [key, value] = labelPattern.split('=', 2);

  if (!key) {
    return false;
  }

  // Key-only match: check if label key exists
  if (value === undefined) {
    return key in labels;
  }

  // Key-value match: check if label key exists and value matches
  return labels[key] === value;
}
