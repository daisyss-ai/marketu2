'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, LucideIcon } from 'lucide-react';
import { FilterState, FilterOption } from '../types';

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  value: any;
  onChange: (value: any) => void;
  icon?: LucideIcon;
}

const FilterDropdown = ({ label, options, value, onChange, icon: Icon }: FilterDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue === 'clear' ? null : optionValue);
    setIsOpen(false);
  };

  const displayValue = value
    ? options.find((opt) => opt.value === value)?.label || 'Selecionar'
    : 'Selecionar';

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2.5 rounded-full text-xs md:text-sm flex items-center gap-2 border-2 transition-all duration-200 font-medium focus:outline-none focus:ring-4 ${
          value 
            ? 'border-primary/30 bg-primary/10 text-primary focus:ring-primary/20' 
            : 'bg-surface border-muted/10 text-muted hover:border-primary/30 hover:bg-muted/5 focus:ring-primary/10'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {Icon && <Icon className="w-3.5 h-3.5" />}
        <span className="hidden xs:inline">
          {value ? `${label}: ${displayValue}` : label}
        </span>
        <span className="xs:hidden">{label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-surface border border-muted/10 rounded-2xl shadow-xl z-50 min-w-[200px] py-1 animate-in fade-in zoom-in-95 duration-200">
          {value && (
            <button
              onClick={() => handleSelect('clear')}
              className="w-full text-left px-4 py-2.5 text-xs text-error hover:bg-error/5 border-b border-muted/10 font-bold transition-colors"
            >
              Limpar Filtro
            </button>
          )}
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                value === option.value
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-muted hover:bg-muted/5'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface PriceRangeDropdownProps {
  value: { min: number; max: number };
  onChange: (min: number, max: number) => void;
}

const PriceRangeDropdown = ({ value, onChange }: PriceRangeDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const priceRanges = [
    { label: '0 - 5.000 Kz', min: 0, max: 5000 },
    { label: '5.000 - 15.000 Kz', min: 5000, max: 15000 },
    { label: '15.000 - 50.000 Kz', min: 15000, max: 50000 },
    { label: '50.000+ Kz', min: 50000, max: Infinity },
  ];

  const handleSelect = (min: number, max: number) => {
    onChange(min, max);
    setIsOpen(false);
  };

  const displayValue =
    value.min === 0 && value.max === Infinity
      ? 'Selecionar'
      : priceRanges.find((r) => r.min === value.min && r.max === value.max)?.label;

  const isActive = value.min > 0 || value.max !== Infinity;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2.5 rounded-full text-xs md:text-sm flex items-center gap-2 border-2 transition-all duration-200 font-medium focus:outline-none focus:ring-4 ${
          isActive 
            ? 'border-primary/30 bg-primary/10 text-primary focus:ring-primary/20' 
            : 'bg-surface border-muted/10 text-muted hover:border-primary/30 hover:bg-muted/5 focus:ring-primary/10'
        }`}
        aria-expanded={isOpen}
      >
        <span className="hidden xs:inline">
          {isActive ? `Preço: ${displayValue}` : 'Preço'}
        </span>
        <span className="xs:hidden">Preço</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-surface border border-muted/10 rounded-2xl shadow-xl z-50 min-w-[200px] py-1 animate-in fade-in zoom-in-95 duration-200">
          {isActive && (
            <button
              onClick={() => handleSelect(0, Infinity)}
              className="w-full text-left px-4 py-2.5 text-xs text-error hover:bg-error/5 border-b border-muted/10 font-bold transition-colors"
            >
              Limpar Filtro
            </button>
          )}
          {priceRanges.map((range) => (
            <button
              key={range.label}
              onClick={() => handleSelect(range.min, range.max)}
              className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                value.min === range.min && value.max === range.max
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-muted hover:bg-muted/5'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (type: keyof FilterState, value: any) => void;
  onPriceChange: (min: number, max: number) => void;
  onSortChange: (sort: string) => void;
  onClearAll: () => void;
  sorting: string;
  hasActiveFilters: boolean;
  activeFilterCount: number;
}

const FilterBar = ({
  filters,
  onFilterChange,
  onPriceChange,
  onSortChange,
  onClearAll,
  sorting,
  hasActiveFilters,
  activeFilterCount,
}: FilterBarProps) => {
  const conditionOptions = [
    { label: 'Novo', value: 'novo' },
    { label: 'Como Novo', value: 'como_novo' },
    { label: 'Usado', value: 'usado' },
  ];

  const categoryOptions = [
    { label: 'Material Escolar', value: 'material_escolar' },
    { label: 'Tecnologia', value: 'tecnologia' },
    { label: 'Livros', value: 'livros' },
    { label: 'Roupas e Acessórios', value: 'roupas' },
    { label: 'Serviços', value: 'servicos' },
    { label: 'Outros', value: 'outros' },
  ];

  const ratingOptions = [
    { label: '5 Estrelas', value: 5 },
    { label: '4+ Estrelas', value: 4 },
    { label: '3+ Estrelas', value: 3 },
  ];

  const sortOptions = [
    { label: 'Mais Recentes', value: 'newest' },
    { label: 'Menor Preço', value: 'price_asc' },
    { label: 'Maior Preço', value: 'price_desc' },
    { label: 'Melhores Avaliações', value: 'rating' },
  ];

  return (
    <div className="bg-surface border-b border-muted/10 sticky top-[73px] z-40 backdrop-blur-md bg-surface/80">
      <div className="max-w-6xl mx-auto px-6 py-4">
        {/* Filter buttons and sort dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex flex-wrap gap-2">
            <FilterDropdown
              label="Condição"
              options={conditionOptions}
              value={filters.condition}
              onChange={(value) => onFilterChange('condition', value)}
            />

            <PriceRangeDropdown
              value={{ min: filters.priceMin, max: filters.priceMax }}
              onChange={onPriceChange}
            />

            <FilterDropdown
              label="Categoria"
              options={categoryOptions}
              value={filters.category}
              onChange={(value) => onFilterChange('category', value)}
            />

            <FilterDropdown
              label="Avaliações"
              options={ratingOptions}
              value={filters.rating}
              onChange={(value) => onFilterChange('rating', value)}
            />

            {hasActiveFilters && (
              <button
                onClick={onClearAll}
                className="bg-error/10 hover:bg-error/20 border border-error/20 text-error px-4 py-2.5 rounded-full text-xs md:text-sm flex items-center gap-2 transition-all font-bold focus:ring-4 focus:ring-error/20"
              >
                <X className="w-3.5 h-3.5" />
                <span>Limpar Todos</span>
              </button>
            )}
          </div>

          {/* Sort dropdown - right side */}
          <div className="mt-2 md:mt-0 flex items-center gap-3">
            <span className="text-xs font-bold text-muted uppercase tracking-wider hidden lg:block">Ordenar por:</span>
            <select
              value={sorting}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-surface border-2 border-muted/10 hover:border-primary/30 rounded-full px-5 py-2.5 text-xs md:text-sm text-foreground font-semibold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all cursor-pointer appearance-none pr-10 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22currentColor%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filters display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 text-xs pt-3 border-t border-muted/5">
            <span className="text-muted font-bold uppercase tracking-widest text-[10px]">Filtros ativos:</span>
            {filters.condition && (
              <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center gap-2 font-semibold">
                Condição: {conditionOptions.find((o) => o.value === filters.condition)?.label}
                <button
                  onClick={() => onFilterChange('condition', null)}
                  className="hover:scale-110 transition-transform p-0.5"
                  aria-label="Remover filtro de condição"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(filters.priceMin > 0 || filters.priceMax !== Infinity) && (
              <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center gap-2 font-semibold">
                Preço: {filters.priceMin} - {filters.priceMax === Infinity ? '+' : filters.priceMax} Kz
                <button
                  onClick={() => onPriceChange(0, Infinity)}
                  className="hover:scale-110 transition-transform p-0.5"
                  aria-label="Remover filtro de preço"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.category && (
              <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center gap-2 font-semibold">
                Categoria: {categoryOptions.find((o) => o.value === filters.category)?.label}
                <button
                  onClick={() => onFilterChange('category', null)}
                  className="hover:scale-110 transition-transform p-0.5"
                  aria-label="Remover filtro de categoria"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.rating && (
              <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center gap-2 font-semibold">
                Avaliação: {filters.rating}+ Estrelas
                <button
                  onClick={() => onFilterChange('rating', null)}
                  className="hover:scale-110 transition-transform p-0.5"
                  aria-label="Remover filtro de avaliação"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
