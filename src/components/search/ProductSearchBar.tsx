'use client';

import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { productsAPI } from '../../services/api';
import type { ProductSuggestion } from '../../types';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

export type ProductSearchBarProps = {
  value: string;
  onChange: (next: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  enableAutocomplete?: boolean;
};

export default function ProductSearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Buscar produtos...',
  enableAutocomplete = true,
}: ProductSearchBarProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmed = useMemo(() => value.trim(), [value]);
  const debouncedSearch = useDebouncedValue(trimmed, 220);

  const applySuggestions = useEffectEvent((nextSuggestions: ProductSuggestion[]) => {
    setSuggestions(nextSuggestions);
    setOpen(nextSuggestions.length > 0);
  });

  useEffect(() => {
    if (!enableAutocomplete) return;
    if (debouncedSearch.length < 2) {
      applySuggestions([]);
      setLoading(false);
      return;
    }

    const abortController = new AbortController();
    setLoading(true);

    void (async () => {
      try {
        const res = await productsAPI.suggest(debouncedSearch, {
          limit: 8,
          signal: abortController.signal,
        });
        applySuggestions(res.suggestions || []);
      } catch (error) {
        if (abortController.signal.aborted) return;
        console.error('Suggestion fetch failed:', error);
        applySuggestions([]);
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      abortController.abort();
    };
  }, [debouncedSearch, enableAutocomplete]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="w-full focus-within:max-w-3xl mx-auto bg-muted/5 rounded-full py-2.5 px-6 border border-muted/10 transition-all duration-300 flex items-center gap-3 focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary/30 group">
        <Search className="text-muted group-focus-within:text-primary transition-colors w-5 h-5" aria-hidden="true" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(suggestions.length > 0)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setOpen(false);
              onSubmit?.();
            }
            if (e.key === 'Escape') setOpen(false);
          }}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted/60"
          aria-label="Buscar produtos no marketplace"
          autoComplete="off"
        />
        {loading && <span className="text-[11px] text-muted font-semibold">...</span>}
      </div>

      {enableAutocomplete && open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-surface border border-muted/10 rounded-2xl shadow-xl z-50 overflow-hidden">
          {suggestions.map((s, idx) => (
            <button
              key={`${s.type}-${s.value}-${idx}`}
              className="w-full text-left px-5 py-3 text-sm text-foreground hover:bg-muted/5 transition-colors"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(s.value);
                setOpen(false);
                onSubmit?.();
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
