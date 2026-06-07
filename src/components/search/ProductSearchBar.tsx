'use client';

import { Search } from 'lucide-react';
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { productsAPI } from '../../services/api';
import type { ProductSuggestion } from '../../types';

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
  const [isFocused, setIsFocused] = useState(false);
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef({ queryIndex: 0, charIndex: 0, deleting: false });

  const trimmed = useMemo(() => value.trim(), [value]);
  const debouncedSearch = useDebouncedValue(trimmed, 220);

  // Typing animation for placeholder (fixed - uses ref to avoid infinite loop)
  useEffect(() => {
    if (isFocused || value) {
      setAnimatedPlaceholder('');
      if (animationRef.current) clearTimeout(animationRef.current);
      return;
    }

    const QUERIES = [
      'Livro de Cálculo...',
      'Calculadora Casio...',
      'Mochila Converse...',
      'iPhone 8...',
      'Cabo de Rede Cat6...',
    ];

    const tick = () => {
      const s = stateRef.current;
      const query = QUERIES[s.queryIndex];

      if (!s.deleting) {
        if (s.charIndex < query.length) {
          s.charIndex++;
          setAnimatedPlaceholder(query.slice(0, s.charIndex));
          animationRef.current = setTimeout(tick, 80);
        } else {
          s.deleting = true;
          animationRef.current = setTimeout(tick, 1500);
        }
      } else {
        if (s.charIndex > 0) {
          s.charIndex--;
          setAnimatedPlaceholder(query.slice(0, s.charIndex));
          animationRef.current = setTimeout(tick, 40);
        } else {
          s.deleting = false;
          s.queryIndex = (s.queryIndex + 1) % QUERIES.length;
          animationRef.current = setTimeout(tick, 300);
        }
      }
    };

    animationRef.current = setTimeout(tick, 300);

    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, [isFocused, value]);

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
    <>
      <style>{`
        @keyframes gradient-slide {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
      <div ref={containerRef} className="relative w-full">
        {/* Animated gradient border wrapper */}
        <div
          style={{
            background: 'linear-gradient(90deg, #4B187C, #6d28b0, #EDE7FF, #6d28b0, #4B187C)',
            backgroundSize: '200% 100%',
            padding: '2px',
            animation: 'gradient-slide 3s linear infinite',
            borderRadius: 5,
            width: '100%',
          }}
        >
          {/* Inner container with actual input */}
          <div className="relative bg-white w-full" style={{ borderRadius: 5 }}>
            <div className={`w-full flex items-center gap-3 py-2.5 px-6 transition-all duration-300 ${
              isFocused ? 'shadow-lg shadow-[#4B187C]/30' : ''
            }`}>
              <Search className={`w-5 h-5 transition-colors ${
                isFocused ? 'text-[#4B187C]' : 'text-gray-400'
              }`} aria-hidden="true" />
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setOpen(false);
                    onSubmit?.();
                  }
                  if (e.key === 'Escape') setOpen(false);
                }}
                placeholder={animatedPlaceholder || placeholder}
                className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400 border-0"
                style={{ borderRadius: 5 }}
                aria-label="Buscar produtos no marketplace"
                autoComplete="off"
              />
              {loading && <span className="text-[11px] text-gray-500 font-semibold">...</span>}
            </div>
          </div>
        </div>

        {enableAutocomplete && open && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
            {suggestions.map((s, idx) => (
              <button
                key={`${s.type}-${s.value}-${idx}`}
                className="w-full text-left px-5 py-3 text-sm text-gray-900 hover:bg-gray-50 transition-colors"
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
    </>
  );
}
