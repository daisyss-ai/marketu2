import type { Product } from '../../../../types';
import type { ProductSuggestion } from './types';
import { normalizeText } from './fulltext';

export function buildSuggestions(products: Product[], search: string, limit: number): ProductSuggestion[] {
  const normalizedSearch = normalizeText(search);
  if (normalizedSearch.length < 2) return [];

  const seen = new Set<string>();
  const suggestions: ProductSuggestion[] = [];

  for (const product of products) {
    const title = product.title?.trim();
    if (!title) continue;

    const key = normalizeText(title);
    if (!key.includes(normalizedSearch) || seen.has(key)) continue;

    seen.add(key);
    suggestions.push({
      type: 'product',
      value: title,
      label: title,
    });

    if (suggestions.length >= limit) break;
  }

  return suggestions;
}
