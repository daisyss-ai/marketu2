'use client';
import { ChevronDown, LucideIcon, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FilterOption, FilterState } from '../types';

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

  /* const gradeOptions = [
    { label: '10Âª Classe', value: 10 },
    { label: '11Âª Classe', value: 11 },
    { label: '12Âª Classe', value: 12 },
    { label: '13Âª Classe', value: 13 },
  ];

  const typeOptions = [
    { label: 'Material', value: 'material' },
    { label: 'ServiÃ§o', value: 'servico' },
  ];

  const subjectOptions = [
    { label: 'MatemÃ¡tica', value: 'MatemÃ¡tica' },
    { label: 'FÃ­sica', value: 'FÃ­sica' },
    { label: 'QuÃ­mica', value: 'QuÃ­mica' },
    { label: 'Biologia', value: 'Biologia' },
    { label: 'PortuguÃªs', value: 'PortuguÃªs' },
    { label: 'InglÃªs', value: 'InglÃªs' },
    { label: 'HistÃ³ria', value: 'HistÃ³ria' },
    { label: 'Geografia', value: 'Geografia' },
    { label: 'InformÃ¡tica', value: 'InformÃ¡tica' },
  ];

  const locationOptions = [
    { label: 'Talatona', value: 'Talatona' },
    { label: 'Viana', value: 'Viana' },
    { label: 'Kilamba', value: 'Kilamba' },
    { label: 'Maianga', value: 'Maianga' },
    { label: 'Cazenga', value: 'Cazenga' },
    { label: 'Rangel', value: 'Rangel' },
    { label: 'Camama', value: 'Camama' },
    { label: 'Benfica', value: 'Benfica' },
    { label: 'Luanda (Centro)', value: 'Centro' },
  ];

  */

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
  activeFilterCount: _activeFilterCount,
}: FilterBarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const gradeOptions: FilterOption[] = [
    { label: '10Âª Classe', value: 10 },
    { label: '11Âª Classe', value: 11 },
    { label: '12Âª Classe', value: 12 },
    { label: '13Âª Classe', value: 13 },
  ];

  const typeOptions: FilterOption[] = [
    { label: 'Material', value: 'material' },
    { label: 'ServiÃ§o', value: 'servico' },
  ];

  const subjectOptions: FilterOption[] = [
    { label: 'MatemÃ¡tica', value: 'MatemÃ¡tica' },
    { label: 'FÃ­sica', value: 'FÃ­sica' },
    { label: 'QuÃ­mica', value: 'QuÃ­mica' },
    { label: 'Biologia', value: 'Biologia' },
    { label: 'PortuguÃªs', value: 'PortuguÃªs' },
    { label: 'InglÃªs', value: 'InglÃªs' },
    { label: 'HistÃ³ria', value: 'HistÃ³ria' },
    { label: 'Geografia', value: 'Geografia' },
    { label: 'InformÃ¡tica', value: 'InformÃ¡tica' },
  ];

  const locationOptions: FilterOption[] = [
    { label: 'Talatona', value: 'Talatona' },
    { label: 'Viana', value: 'Viana' },
    { label: 'Kilamba', value: 'Kilamba' },
    { label: 'Maianga', value: 'Maianga' },
    { label: 'Cazenga', value: 'Cazenga' },
    { label: 'Rangel', value: 'Rangel' },
    { label: 'Camama', value: 'Camama' },
    { label: 'Benfica', value: 'Benfica' },
    { label: 'Luanda (Centro)', value: 'Centro' },
  ];

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
    { label: 'RelevÃ¢ncia', value: 'relevance' },
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
          {/* Mobile filters button */}
          <div className="md:hidden w-full flex items-center justify-between gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="bg-surface border-2 border-muted/10 hover:border-primary/30 rounded-full px-5 py-2.5 text-xs text-foreground font-semibold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros {_activeFilterCount > 0 ? `(${_activeFilterCount})` : ''}
            </button>

            {hasActiveFilters && (
              <button
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

            <FilterDropdown
              label="Classe"
              options={gradeOptions}
              value={filters.gradeLevel}
              onChange={(value) => onFilterChange('gradeLevel', value)}
            />

            <FilterDropdown
              label="Disciplina"
              options={subjectOptions}
              value={filters.subject}
              onChange={(value) => onFilterChange('subject', value)}
            />

            <FilterDropdown
              label="Tipo"
              options={typeOptions}
              value={filters.productType}
              onChange={(value) => onFilterChange('productType', value)}
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
            {filters.gradeLevel && (
              <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center gap-2 font-semibold">
                Classe: {filters.gradeLevel}Âª
                <button
                  onClick={() => onFilterChange('gradeLevel', null)}
                  className="hover:scale-110 transition-transform p-0.5"
                  aria-label="Remover filtro de classe"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.subject && (
              <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center gap-2 font-semibold">
                Disciplina: {filters.subject}
                <button
                  onClick={() => onFilterChange('subject', null)}
                  className="hover:scale-110 transition-transform p-0.5"
                  aria-label="Remover filtro de disciplina"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.productType && (
              <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center gap-2 font-semibold">
                Tipo: {filters.productType === 'servico' ? 'ServiÃ§o' : 'Material'}
                <button
                  onClick={() => onFilterChange('productType', null)}
                  className="hover:scale-110 transition-transform p-0.5"
                  aria-label="Remover filtro de tipo"
                >
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
                <option value="">CondiÃ§Ã£o</option>
                {conditionOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.category || ''}
                onChange={(e) => onFilterChange('category', e.target.value || null)}
                className="bg-surface border border-muted/10 rounded-2xl px-4 py-3 text-sm"
              >
                <option value="">Categoria</option>
                {categoryOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.gradeLevel ?? ''}
                onChange={(e) => onFilterChange('gradeLevel', e.target.value ? Number(e.target.value) : null)}
                className="bg-surface border border-muted/10 rounded-2xl px-4 py-3 text-sm"
              >
                <option value="">Classe</option>
                {gradeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.subject || ''}
                onChange={(e) => onFilterChange('subject', e.target.value || null)}
                className="bg-surface border border-muted/10 rounded-2xl px-4 py-3 text-sm"
              >
                <option value="">Disciplina</option>
                {subjectOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.productType || ''}
                onChange={(e) => onFilterChange('productType', e.target.value || null)}
                className="bg-surface border border-muted/10 rounded-2xl px-4 py-3 text-sm"
              >
                <option value="">Tipo</option>
                {typeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
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
                placeholder="PreÃ§o mÃ­n."
              />
              <input
                type="number"
                inputMode="numeric"
                value={filters.priceMax === Infinity ? '' : filters.priceMax}
                onChange={(e) => onPriceChange(filters.priceMin, e.target.value ? Number(e.target.value) : Infinity)}
                className="bg-surface border border-muted/10 rounded-2xl px-4 py-3 text-sm"
                placeholder="PreÃ§o mÃ¡x."
              />
            </div>

            <div className="flex items-center justify-between gap-3 mt-5">
              <button
                onClick={() => {
                  onClearAll();
                  setMobileOpen(false);
                }}
                className="flex-1 bg-error/10 hover:bg-error/20 border border-error/20 text-error px-4 py-3 rounded-2xl text-sm font-bold transition-all"
              >
                Limpar
              </button>
              <button
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
