import type { Product } from '../../../../types';
import type { ProductSearchFilters } from './types';

export const SEARCHABLE_FIELDS = ['title', 'category', 'subject', 'description', 'location'] as const;
const TOKEN_SPLIT_REGEX = /[\s,.;:!?/\\()"'[\]{}_-]+/g;

export function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function tokenizeSearch(value: string) {
  return normalizeText(value)
    .split(TOKEN_SPLIT_REGEX)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function escapeLike(value: string) {
  return value.replace(/[,%_]/g, (match) => `\\${match}`);
}

export function buildSearchText(product: Product) {
  return normalizeText(
    [
      product.title,
      product.category,
      product.subject,
      product.location,
      product.description,
      typeof product.gradeLevel === 'number' ? `${product.gradeLevel} classe` : '',
      product.productType === 'servico' ? 'servico servico explicacao explicacoes aula aulas' : '',
      product.productType === 'material' ? 'material livro caderno mochila calculadora' : '',
    ]
      .filter(Boolean)
      .join(' ')
  );
}

export function buildSearchOrClause(search: string) {
  const escaped = escapeLike(search);
  return SEARCHABLE_FIELDS.map((field) => `${field}.ilike.%${escaped}%`).join(',');
}

export function buildPortugueseSearchQuery(search: string) {
  const normalized = search.trim();
  return normalized ? normalized : '';
}

export function getAppliedFilters(query: ProductSearchFilters): ProductSearchFilters {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== '')
  ) as ProductSearchFilters;
}
