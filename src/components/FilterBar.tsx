'use client';
import { ChevronDown, LucideIcon, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FilterOption, FilterState } from '../types';

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  icon?: LucideIcon;
}

const FilterDropdown = ({ label, options, value, onChange, icon: Icon }: FilterDropdownProps) => {
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
        type="button"
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
        <span className="hidden xs:inline">{value ? `${label}: ${displayValue}` : label}</span>
        <span className="xs:hidden">{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-surface border border-muted/10 rounded-2xl shadow-xl z-50 min-w-[200px] py-1 animate-in fade-in zoom-in-95 duration-200">
          {value && (
            <button
              type="button"
              onClick={() => handleSelect('clear')}
              className="w-full text-left px-4 py-2.5 text-xs text-error hover:bg-error/5 border-b border-muted/10 font-bold transition-colors"
            >
              Limpar Filtro
            </button>
          )}
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                value === option.value ? 'bg-primary/10 text-primary font-bold' : 'text-muted hover:bg-muted/5'
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
      : priceRanges.find((range) => range.min === value.min && range.max === value.max)?.label;

  const isActive = value.min > 0 || value.max !== Infinity;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2.5 rounded-full text-xs md:text-sm flex items-center gap-2 border-2 transition-all duration-200 font-medium focus:outline-none focus:ring-4 ${
          isActive
            ? 'border-primary/30 bg-primary/10 text-primary focus:ring-primary/20'
            : 'bg-surface border-muted/10 text-muted hover:border-primary/30 hover:bg-muted/5 focus:ring-primary/10'
        }`}
        aria-expanded={isOpen}
      >
        <span className="hidden xs:inline">{isActive ? `Preço: ${displayValue}` : 'Preço'}</span>
        <span className="xs:hidden">Preço</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-surface border border-muted/10 rounded-2xl shadow-xl z-50 min-w-[200px] py-1 animate-in fade-in zoom-in-95 duration-200">
          {isActive && (
            <button
              type="button"
              onClick={() => handleSelect(0, Infinity)}
              className="w-full text-left px-4 py-2.5 text-xs text-error hover:bg-error/5 border-b border-muted/10 font-bold transition-colors"
            >
              Limpar Filtro
            </button>
          )}
          {priceRanges.map((range) => (
            <button
              type="button"
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
  onFilterChange: (type: keyof FilterState, value: FilterState[keyof FilterState]) => void;
  onPriceChange: (min: number, max: number) => void;
  onSortChange: (sort: string) => void;
  onClearAll: () => void;
  sorting: string;
  hasActiveFilters: boolean;
  activeFilterCount: number;
}

const gradeOptions: FilterOption[] = [
  { label: '10ª Classe', value: 10 },
  { label: '11ª Classe', value: 11 },
  { label: '12ª Classe', value: 12 },
  { label: '13ª Classe', value: 13 },
];

const typeOptions: FilterOption[] = [
  { label: 'Material', value: 'material' },
  { label: 'Serviço', value: 'servico' },
];

const subjectOptions: FilterOption[] = [
  { label: 'Matemática', value: 'Matemática' },
  { label: 'Física', value: 'Física' },
  { label: 'Química', value: 'Química' },
  { label: 'Biologia', value: 'Biologia' },
  { label: 'Português', value: 'Português' },
  { label: 'Inglês', value: 'Inglês' },
  { label: 'História', value: 'História' },
  { label: 'Geografia', value: 'Geografia' },
  { label: 'Informática', value: 'Informática' },
];

const conditionOptions: FilterOption[] = [
  { label: 'Novo', value: 'novo' },
  { label: 'Como Novo', value: 'como_novo' },
  { label: 'Usado', value: 'usado' },
];

const categoryOptions: FilterOption[] = [
  { label: 'Material Escolar', value: 'material_escolar' },
  { label: 'Tecnologia', value: 'tecnologia' },
  { label: 'Livros', value: 'livros' },
  { label: 'Roupas e Acessórios', value: 'roupas' },
  { label: 'Serviços', value: 'servicos' },
  { label: 'Outros', value: 'outros' },
];

const ratingOptions: FilterOption[] = [
  { label: '5 Estrelas', value: 5 },
  { label: '4+ Estrelas', value: 4 },
  { label: '3+ Estrelas', value: 3 },
];

const sortOptions: FilterOption[] = [
  { label: 'Relevância', value: 'relevance' },
  { label: 'Mais Recentes', value: 'newest' },
  { label: 'Menor Preço', value: 'price_asc' },
  { label: 'Maior Preço', value: 'price_desc' },
  { label: 'Melhores Avaliações', value: 'rating' },
];

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
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="bg-surface border-b border-muted/10 sticky top-[73px] z-40 backdrop-blur-md bg-surface/80">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="md:hidden w-full flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="bg-surface border-2 border-muted/10 hover:border-primary/30 rounded-full px-5 py-2.5 text-xs text-foreground font-semibold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros {_activeFilterCount > 0 ? `(${_activeFilterCount})` : ''}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={onClearAll}
                className="bg-error/10 hover:bg-error/20 border border-error/20 text-error px-4 py-2.5 rounded-full text-xs flex items-center gap-2 transition-all font-bold focus:ring-4 focus:ring-error/20"
              >
                <X className="w-3.5 h-3.5" />
                Limpar
              </button>
            )}
          </div>

          <div className="hidden md:flex flex-wrap gap-2">
            <FilterDropdown
              label="Condição"
              options={conditionOptions}
              value={filters.condition}
              onChange={(value) => onFilterChange('condition', value)}
            />
            <PriceRangeDropdown value={{ min: filters.priceMin, max: filters.priceMax }} onChange={onPriceChange} />
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
            <FilterDropdown
              label="Classe"
              options={gradeOptions}
              value={filters.gradeLevel}
              onChange={(value) => onFilterChange('gradeLevel', value as number | null)}
            />
            <FilterDropdown
              label="Disciplina"
              options={subjectOptions}
              value={filters.subject}
              onChange={(value) => onFilterChange('subject', value as string | null)}
            />
            <FilterDropdown
              label="Tipo"
              options={typeOptions}
              value={filters.productType}
              onChange={(value) => onFilterChange('productType', value as 'material' | 'servico' | null)}
            />

            {hasActiveFilters && (
              <button
                type="button"
                onClick={onClearAll}
                className="bg-error/10 hover:bg-error/20 border border-error/20 text-error px-4 py-2.5 rounded-full text-xs md:text-sm flex items-center gap-2 transition-all font-bold focus:ring-4 focus:ring-error/20"
              >
                <X className="w-3.5 h-3.5" />
                <span>Limpar Todos</span>
              </button>
            )}
          </div>

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

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 text-xs pt-3 border-t border-muted/5">
            <span className="text-muted font-bold uppercase tracking-widest text-[10px]">Filtros ativos:</span>
            {filters.condition && (
              <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center gap-2 font-semibold">
                Condição: {conditionOptions.find((option) => option.value === filters.condition)?.label}
                <button type="button" onClick={() => onFilterChange('condition', null)} className="hover:scale-110 transition-transform p-0.5" aria-label="Remover filtro de condição">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(filters.priceMin > 0 || filters.priceMax !== Infinity) && (
              <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center gap-2 font-semibold">
                Preço: {filters.priceMin} - {filters.priceMax === Infinity ? '+' : filters.priceMax} Kz
                <button type="button" onClick={() => onPriceChange(0, Infinity)} className="hover:scale-110 transition-transform p-0.5" aria-label="Remover filtro de preço">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.category && (
              <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center gap-2 font-semibold">
                Categoria: {categoryOptions.find((option) => option.value === filters.category)?.label}
                <button type="button" onClick={() => onFilterChange('category', null)} className="hover:scale-110 transition-transform p-0.5" aria-label="Remover filtro de categoria">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.rating && (
              <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center gap-2 font-semibold">
                Avaliação: {filters.rating}+ Estrelas
                <button type="button" onClick={() => onFilterChange('rating', null)} className="hover:scale-110 transition-transform p-0.5" aria-label="Remover filtro de avaliação">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.gradeLevel && (
              <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center gap-2 font-semibold">
                Classe: {filters.gradeLevel}ª
                <button type="button" onClick={() => onFilterChange('gradeLevel', null)} className="hover:scale-110 transition-transform p-0.5" aria-label="Remover filtro de classe">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.subject && (
              <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center gap-2 font-semibold">
                Disciplina: {filters.subject}
                <button type="button" onClick={() => onFilterChange('subject', null)} className="hover:scale-110 transition-transform p-0.5" aria-label="Remover filtro de disciplina">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.productType && (
              <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center gap-2 font-semibold">
                Tipo: {filters.productType === 'servico' ? 'Serviço' : 'Material'}
                <button type="button" onClick={() => onFilterChange('productType', null)} className="hover:scale-110 transition-transform p-0.5" aria-label="Remover filtro de tipo">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-x-0 bottom-0 bg-surface rounded-t-3xl border-t border-muted/10 p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="font-black text-foreground">Filtros</div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-full hover:bg-muted/5 focus:ring-4 focus:ring-primary/10"
                aria-label="Fechar filtros"
              >
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select
                value={filters.condition || ''}
                onChange={(e) => onFilterChange('condition', e.target.value || null)}
                className="bg-surface border border-muted/10 rounded-2xl px-4 py-3 text-sm"
              >
                <option value="">Condição</option>
                {conditionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.category || ''}
                onChange={(e) => onFilterChange('category', e.target.value || null)}
                className="bg-surface border border-muted/10 rounded-2xl px-4 py-3 text-sm"
              >
                <option value="">Categoria</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.gradeLevel ?? ''}
                onChange={(e) => onFilterChange('gradeLevel', e.target.value ? Number(e.target.value) : null)}
                className="bg-surface border border-muted/10 rounded-2xl px-4 py-3 text-sm"
              >
                <option value="">Classe</option>
                {gradeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.subject || ''}
                onChange={(e) => onFilterChange('subject', e.target.value || null)}
                className="bg-surface border border-muted/10 rounded-2xl px-4 py-3 text-sm"
              >
                <option value="">Disciplina</option>
                {subjectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.productType || ''}
                onChange={(e) => onFilterChange('productType', e.target.value || null)}
                className="bg-surface border border-muted/10 rounded-2xl px-4 py-3 text-sm"
              >
                <option value="">Tipo</option>
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <input
                type="number"
                inputMode="numeric"
                value={filters.priceMin || 0}
                onChange={(e) => onPriceChange(Number(e.target.value || 0), filters.priceMax)}
                className="bg-surface border border-muted/10 rounded-2xl px-4 py-3 text-sm"
                placeholder="Preço mín."
              />
              <input
                type="number"
                inputMode="numeric"
                value={filters.priceMax === Infinity ? '' : filters.priceMax}
                onChange={(e) => onPriceChange(filters.priceMin, e.target.value ? Number(e.target.value) : Infinity)}
                className="bg-surface border border-muted/10 rounded-2xl px-4 py-3 text-sm"
                placeholder="Preço máx."
              />
            </div>

            <div className="flex items-center justify-between gap-3 mt-5">
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  setMobileOpen(false);
                }}
                className="flex-1 bg-error/10 hover:bg-error/20 border border-error/20 text-error px-4 py-3 rounded-2xl text-sm font-bold transition-all"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex-1 bg-primary text-white px-4 py-3 rounded-2xl text-sm font-bold hover:opacity-90 transition-all"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
