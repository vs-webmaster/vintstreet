// Grouping utility functions

export interface GroupedByName {
  name: string;
  ids: string[];
}

/**
 * Groups items by name and collects all IDs for each unique name.
 * Useful for deduplicating category lists while preserving all associated IDs.
 */
export const groupByNameWithIds = <T extends { id: string; name: string }>(
  items: T[]
): GroupedByName[] => {
  const grouped = items.reduce<Record<string, GroupedByName>>((acc, item) => {
    if (!acc[item.name]) {
      acc[item.name] = { name: item.name, ids: [] };
    }
    acc[item.name].ids.push(item.id);
    return acc;
  }, {});

  return Object.values(grouped);
};
