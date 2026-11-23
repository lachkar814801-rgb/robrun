import Fuse from 'fuse.js';
import type { IFuseOptions } from 'fuse.js';

/**
 * Recherche floue dans une liste d'objets qui possèdent une propriété `name_en`.
 * Retourne les résultats triés par score de pertinence.
 */
export function searchItems<T extends { name_en?: string }>(
  items: T[],
  query: string,
  options?: IFuseOptions<T>
): T[] {
  if (!query || query.trim() === '') {
    return items;
  }

  const fuse = new Fuse(items, {
    keys: ['name_en'],
    threshold: 0.3,
    ...options,
  });

  return fuse.search(query).map((result) => result.item);
}
