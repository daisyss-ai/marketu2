/**
 * @file useSuggestions Hook
 * @description Hook para autocomplete/sugestões com debounce
 * Features:
 * - Debounce automático (evita 100 requisições ao digitar)
 * - Cache de sugestões
 * - Ranking de relevância
 */

'use client';

import { SEARCH } from '@/lib/constants/search';
import { createCacheKey } from '@/lib/services/cache-key';
import { queryConfigs } from '@/lib/services/query-client';
import { SuggestionItem } from '@/types/search';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

/**
 * Hook para buscar sugestões com debounce
 * Exemplo:
 * const { suggestions, isLoading } = useSuggestions(searchTerm);
 */
export function useSuggestions(searchTerm: string): UseQueryResult<SuggestionItem[]> {
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const debounceTimeout = useRef<NodeJS.Timeout>();

  // Implementar debounce
  useEffect(() => {
    debounceTimeout.current = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, SEARCH.DEBOUNCE_AUTOCOMPLETE_MS);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchTerm]);

  return useQuery({
    queryKey: createCacheKey.suggestion(debouncedTerm),
    queryFn: async () => {
      const response = await fetch(
        `/api/products/suggest?q=${encodeURIComponent(debouncedTerm)}`
      );

      if (!response.ok) {
        console.error('Erro ao buscar sugestões');
        return [];
      }

      const data = await response.json();
      return data.suggestions || [];
    },
    // Só executar query se term tem length mínimo
    enabled: debouncedTerm.length >= SEARCH.MIN_QUERY_LENGTH,
    ...queryConfigs.suggestions,
  });
}

/**
 * Hook para buscar sugestões sem debounce (para componentes que gerenciam debounce próprio)
 */
export function useSuggestionsRaw(searchTerm: string): UseQueryResult<SuggestionItem[]> {
  return useQuery({
    queryKey: createCacheKey.suggestion(searchTerm),
    queryFn: async () => {
      const response = await fetch(
        `/api/products/suggest?q=${encodeURIComponent(searchTerm)}`
      );

      if (!response.ok) {
        console.error('Erro ao buscar sugestões');
        return [];
      }

      const data = await response.json();
      return data.suggestions || [];
    },
    enabled: searchTerm.length >= SEARCH.MIN_QUERY_LENGTH,
    ...queryConfigs.suggestions,
  });
}
