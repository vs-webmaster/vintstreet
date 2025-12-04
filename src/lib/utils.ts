import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface NamedItem {
  id: string;
  name: string;
}

/**
 * Deduplicate items by name and sort alphabetically.
 */
export function uniqueByNameSorted<T extends NamedItem>(items: T[]): NamedItem[] {
  const seen = new Set<string>();
  const result: NamedItem[] = [];

  for (const item of items) {
    if (!seen.has(item.name)) {
      seen.add(item.name);
      result.push({ id: item.id, name: item.name });
    }
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}
