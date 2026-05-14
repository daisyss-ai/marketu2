import type { Product } from '../../../../types';
import { buildSearchText, normalizeText, tokenizeSearch } from './fulltext';

function recencyBoost(product: Product) {
  const createdAt = product.createdAt ? new Date(product.createdAt).getTime() : 0;
  if (!createdAt) return 0;

  const ageInDays = Math.max(0, (Date.now() - createdAt) / (1000 * 60 * 60 * 24));
  return Math.max(0, 2 - ageInDays / 30);
}

export function calculateRelevanceScore(product: Product, search: string) {
  const tokens = tokenizeSearch(search);
  if (tokens.length === 0) return 0;

  const title = normalizeText(product.title);
  const category = normalizeText(product.category || '');
  const subject = normalizeText(product.subject || '');
  const location = normalizeText(product.location || '');
  const description = normalizeText(product.description || '');
  const text = buildSearchText(product);

  let score = 0;

  for (const token of tokens) {
    if (title === token) score += 20;
    if (title.startsWith(token)) score += 12;
    if (title.includes(token)) score += 8;
    if (subject.includes(token)) score += 6;
    if (category.includes(token)) score += 5;
    if (location.includes(token)) score += 3;
    if (description.includes(token)) score += 2;
    if (text.includes(token)) score += 1;
  }

  if (tokens.length > 1 && title.includes(tokens.join(' '))) score += 10;
  score += Math.min(product.rating || 0, 5) * 0.35;
  score += Math.min(product.reviews || 0, 50) * 0.03;
  score += recencyBoost(product);

  return score;
}
