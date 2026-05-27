/**
 * @file Refactored SearchBar Component
 * @description Barra de busca otimizada com debounce e sugestões
 * Substitui: src/components/search/ProductSearchBar.tsx
 */

'use client';

import { useProductFilters } from '@/hooks/filters/useProductFilters';
import { useSuggestions } from '@/hooks/queries/useSuggestions';
import { SEARCH } from '@/lib/constants/search';
import { Loader, Search, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface SearchBarProps {
  onSearch?: (term: string) => void;
  placeholder?: string;
}

/**
 * Componente de barra de busca refatorado
 * - Debounce automático (evita flashing)
 * - Sugestões em tempo real
 * - URL sync automática
 * - Type-safe
 */
export function SearchBar({ onSearch, placeholder = 'Buscar produtos...' }: SearchBarProps) {
  const { query, updateFilter } = useProductFilters();
  const [isOpen, setIsOpen] = useState(false);
  const [localInput, setLocalInput] = useState(query.search || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Hook para sugestões com debounce
  const { data: suggestions = [], isPending: isSuggestionsLoading } = useSuggestions(localInput);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  /**
   * Handle input change com debounce
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalInput(value);

    if (value.length >= SEARCH.MIN_QUERY_LENGTH) {
      setIsOpen(true);
      updateFilter('search', value);
    } else if (value.length === 0) {
      updateFilter('search', null);
      setIsOpen(false);
    }
  };

  /**
   * Handle sugestão clicada
   */
  const handleSuggestionClick = (suggestion: string) => {
    setLocalInput(suggestion);
    updateFilter('search', suggestion);
    setIsOpen(false);
    onSearch?.(suggestion);

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  /**
   * Handle clear
   */
  const handleClear = () => {
    setLocalInput('');
    updateFilter('search', null);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  /**
   * Handle submit
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpen(false);
    onSearch?.(localInput);
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          {/* Search Icon */}
          <Search className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none" />

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={localInput}
            onChange={handleInputChange}
            onFocus={() => localInput.length >= SEARCH.MIN_QUERY_LENGTH && setIsOpen(true)}
            placeholder={placeholder}
            className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />

          {/* Clear Button */}
          {localInput && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Limpar busca"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Loading Indicator */}
          {isSuggestionsLoading && (
            <div className="absolute right-4">
              <Loader className="w-5 h-5 text-purple-500 animate-spin" />
            </div>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {isOpen && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
          >
            {isSuggestionsLoading ? (
              <div className="p-4 text-center text-gray-500">Carregando sugestões...</div>
            ) : suggestions.length > 0 ? (
              <ul className="py-2 max-h-96 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <li key={index}>
                    <button
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion.text)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-2 group"
                    >
                      <Search className="w-4 h-4 text-gray-400 group-hover:text-purple-500" />
                      <span className="flex-1">{suggestion.text}</span>
                      <span className="text-xs text-gray-400">{suggestion.type}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-500">
                Nenhuma sugestão encontrada
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
