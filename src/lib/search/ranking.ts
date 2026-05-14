/**
 * @file Search Ranking Algorithm
 * @description Algoritmo profissional de ranking para relevância de busca
 * Combina TF-IDF, popularidade, recência e ratings
 */

import { RANKING_WEIGHTS } from '@/lib/constants/search';
import { RankedProduct, SearchRankingFactors, SearchResult } from '@/types/search';

/**
 * Normalizar texto para busca (remove acentos, lowercase)
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase()
    .trim();
}

/**
 * Tokenizar query em palavras individuais
 */
export function tokenizeQuery(query: string): string[] {
  return normalizeText(query)
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

/**
 * Calcular TF-IDF score para termo em um documento
 * Term Frequency - Inverse Document Frequency
 * - TF: frequência do termo no documento
 * - IDF: inverso da frequência do termo em todos os documentos
 */
function calculateTFIDF(
  term: string,
  documentText: string,
  totalDocuments: number,
  documentsWithTerm: number
): number {
  // Term Frequency
  const termPattern = new RegExp(`\\b${term}\\b`, 'g');
  const termFrequency = (documentText.match(termPattern) || []).length;
  const tf = termFrequency / documentText.split(/\s+/).length;

  // Inverse Document Frequency
  const idf = Math.log(totalDocuments / (documentsWithTerm || 1));

  return tf * idf;
}

/**
 * Calcular score de match do título (0-100)
 * Weights:
 * - Exact match: 100
 * - Starts with: 90
 * - All words present: 80
 * - Some words present: 40-60
 * - No match: 0
 */
export function calculateTitleMatchScore(query: string, title: string): number {
  const normalizedQuery = normalizeText(query);
  const normalizedTitle = normalizeText(title);

  // Match exato (100%)
  if (normalizedTitle === normalizedQuery) {
    return 100;
  }

  // Começa com o termo (90%)
  if (normalizedTitle.startsWith(normalizedQuery)) {
    return 90;
  }

  // Contém o termo exato (80%)
  if (normalizedTitle.includes(normalizedQuery)) {
    return 80;
  }

  // Verificar quantas palavras do query estão no título
  const queryTokens = tokenizeQuery(query);
  let matchedTokens = 0;

  for (const token of queryTokens) {
    if (normalizedTitle.includes(token)) {
      matchedTokens++;
    }
  }

  // Score baseado em % de palavras encontradas
  if (queryTokens.length > 0) {
    const matchPercentage = matchedTokens / queryTokens.length;
    return matchPercentage * 60; // Max 60% para matches parciais
  }

  return 0;
}

/**
 * Calcular score de match da descrição (0-50)
 * Similar ao título mas com peso menor
 */
export function calculateDescriptionMatchScore(query: string, description: string): number {
  if (!description) return 0;

  const normalizedQuery = normalizeText(query);
  const normalizedDescription = normalizeText(description);

  // Contém o termo exato (50%)
  if (normalizedDescription.includes(normalizedQuery)) {
    return 50;
  }

  // Verificar palavras individuais
  const queryTokens = tokenizeQuery(query);
  let matchedTokens = 0;

  for (const token of queryTokens) {
    if (normalizedDescription.includes(token)) {
      matchedTokens++;
    }
  }

  if (queryTokens.length > 0) {
    const matchPercentage = matchedTokens / queryTokens.length;
    return matchPercentage * 30; // Max 30% para matches parciais
  }

  return 0;
}

/**
 * Calcular score de popularidade (0-30)
 * views + sales normalizados
 */
export function calculatePopularityScore(
  views: number,
  sales: number,
  maxViews: number,
  maxSales: number
): number {
  const viewsScore = (views / (maxViews || 1)) * 20;
  const salesScore = (sales / (maxSales || 1)) * 10;
  return Math.min(30, viewsScore + salesScore);
}

/**
 * Calcular score de recência (0-20)
 * Produtos mais recentes têm score maior
 * Decai exponencialmente após 30 dias
 */
export function calculateRecencyScore(createdAt: string | Date): number {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const ageInDays = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);

  // Score decai exponencialmente
  // Novo (0-7 dias): 20
  // Recente (7-30 dias): 15-10
  // Antigo (30+ dias): <10
  const decayFactor = Math.exp(-ageInDays / 30);
  return Math.max(0, 20 * decayFactor);
}

/**
 * Calcular score de rating (0-20)
 * Baseado em estrelas e número de reviews
 */
export function calculateRatingScore(
  rating: number,
  reviewCount: number,
  minReviewsForFullScore: number = 10
): number {
  // Peso do rating (0-20)
  const ratingComponent = (rating / 5) * 20;

  // Penalidade para poucos reviews
  const reviewWeight = Math.min(1, reviewCount / minReviewsForFullScore);

  return ratingComponent * reviewWeight;
}

/**
 * Calcular score de match de categoria (0-20)
 * Se tem categoria, e é relevante, adiciona score
 */
export function calculateCategoryMatchScore(
  queryCategory: string | null,
  productCategory: string
): number {
  if (!queryCategory) return 0;

  const normalizedQuery = normalizeText(queryCategory);
  const normalizedProduct = normalizeText(productCategory);

  if (normalizedProduct.includes(normalizedQuery)) {
    return 20;
  }

  return 0;
}

/**
 * Calcular todos os factors de ranking para um produto
 */
export function calculateRankingFactors(
  query: string,
  product: SearchResult,
  stats: {
    maxViews: number;
    maxSales: number;
    totalProducts: number;
    productsWithQuery: number;
  }
): SearchRankingFactors {
  return {
    titleMatch: calculateTitleMatchScore(query, product.title),
    descriptionMatch: calculateDescriptionMatchScore(query, product.description || ''),
    popularity: calculatePopularityScore(
      0, // TODO: adicionar views do produto
      0, // TODO: adicionar sales do produto
      stats.maxViews,
      stats.maxSales
    ),
    recency: calculateRecencyScore(product.createdAt),
    rating: calculateRatingScore(product.rating, product.reviewCount),
    category: product.category ? 20 : 0,
  };
}

/**
 * Calcular score final combinando todos os factors
 */
export function calculateFinalScore(factors: SearchRankingFactors): number {
  return (
    factors.titleMatch * RANKING_WEIGHTS.TITLE_MATCH +
    factors.descriptionMatch * RANKING_WEIGHTS.DESCRIPTION_MATCH +
    factors.popularity * RANKING_WEIGHTS.POPULARITY +
    factors.recency * RANKING_WEIGHTS.RECENCY +
    factors.rating * RANKING_WEIGHTS.RATING +
    factors.category * RANKING_WEIGHTS.CATEGORY_MATCH
  );
}

/**
 * Rankear produtos baseado em relevância de busca
 */
export function rankProducts(
  products: SearchResult[],
  query: string,
  stats: {
    maxViews: number;
    maxSales: number;
    totalProducts: number;
    productsWithQuery: number;
  }
): RankedProduct[] {
  const ranked = products.map((product) => {
    const factors = calculateRankingFactors(query, product, stats);
    const score = calculateFinalScore(factors);

    return {
      id: product.id,
      score,
      factors,
    };
  });

  // Ordenar por score descendente
  return ranked.sort((a, b) => b.score - a.score);
}

/**
 * Merear scores com produto original para retorno final
 */
export function mergeRankedProducts(
  products: SearchResult[],
  ranked: RankedProduct[]
): (SearchResult & { score: number })[] {
  const rankedMap = new Map(ranked.map((r) => [r.id, r]));

  return products
    .map((product) => ({
      ...product,
      score: rankedMap.get(product.id)?.score || 0,
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Sumarizar factors em human-readable format
 */
export function summarizeRankingFactors(factors: SearchRankingFactors): string {
  const components = [];

  if (factors.titleMatch > 50) {
    components.push(`título (${factors.titleMatch.toFixed(0)}%)`);
  }
  if (factors.descriptionMatch > 20) {
    components.push(`descrição (${factors.descriptionMatch.toFixed(0)}%)`);
  }
  if (factors.popularity > 10) {
    components.push(`popularidade (${factors.popularity.toFixed(0)}%)`);
  }
  if (factors.rating > 10) {
    components.push(`avaliação (${factors.rating.toFixed(0)}/20)`);
  }
  if (factors.recency > 10) {
    components.push(`recente (${factors.recency.toFixed(0)}/20)`);
  }

  return components.join(', ');
}
