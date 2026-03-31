import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react';

const FilterDropdown = ({ label, options, value, onChange, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
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
        className={`bg-gray-100 hover:bg-gray-200 hover:border-gray-300 px-4 py-2 rounded-full text-xs md:text-sm flex items-center gap-2 border-2 transition-all duration-200 ${
          value ? 'border-purple-300 bg-purple-50 text-purple-900' : 'border-gray-200 text-gray-700'
        }`}
      >
        {Icon && <Icon className="w-3 h-3" />}
        <span className="hidden xs:inline">
          {value ? `${label}: ${displayValue}` : label}
        </span>
        <span className="xs:hidden">{label}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-max">
          {value && (
            <button
              onClick={() => handleSelect('clear')}
              className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 border-b border-gray-100 font-medium"
            >
              Limpar Filtro
            </button>
          )}
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 transition-colors ${
                value === option.value
                  ? 'bg-purple-100 text-purple-900 font-semibold'
                  : 'text-gray-700'
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

const PriceRangeDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
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

  const handleSelect = (min, max) => {
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
        className={`bg-gray-100 hover:bg-gray-200 hover:border-gray-300 px-4 py-2 rounded-full text-xs md:text-sm flex items-center gap-2 border-2 transition-all duration-200 ${
          isActive ? 'border-purple-300 bg-purple-50 text-purple-900' : 'border-gray-200 text-gray-700'
        }`}
      >
        <span className="hidden xs:inline">
          {isActive ? `Preço: ${displayValue}` : 'Preço'}
        </span>
        <span className="xs:hidden">Preço</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-max">
          {isActive && (
            <button
              onClick={() => handleSelect(0, Infinity)}
              className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 border-b border-gray-100 font-medium"
            >
              Limpar Filtro
            </button>
          )}
          {priceRanges.map((range) => (
            <button
              key={range.label}
              onClick={() => handleSelect(range.min, range.max)}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 transition-colors ${
                value.min === range.min && value.max === range.max
                  ? 'bg-purple-100 text-purple-900 font-semibold'
                  : 'text-gray-700'
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

const FilterBar = ({
  filters,
  onFilterChange,
  onPriceChange,
  onSortChange,
  onClearAll,
  sorting,
  hasActiveFilters,
  activeFilterCount,
}) => {
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
    <div className="bg-white border-y border-gray-100 sticky top-0 z-40">
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
                className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 px-4 py-2 rounded-full text-xs md:text-sm flex items-center gap-2 transition-colors"
              >
                <X className="w-3 h-3" />
                <span>Limpar Tudo</span>
              </button>
            )}
          </div>

          {/* Sort dropdown - right side */}
          <div className="mt-2 md:mt-0">
            <select
              value={sorting}
              onChange={(e) => onSortChange(e.target.value)}
              className="border-2 border-gray-200 hover:border-purple-300 rounded-full px-4 py-2 text-xs md:text-sm text-gray-700 bg-white focus:outline-none focus:border-purple-400 transition-colors cursor-pointer"
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
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-600">Filtros ativos:</span>
            {filters.condition && (
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full flex items-center gap-2">
                Condição: {conditionOptions.find((o) => o.value === filters.condition)?.label}
                <button
                  onClick={() => onFilterChange('condition', null)}
                  className="hover:text-purple-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(filters.priceMin > 0 || filters.priceMax !== Infinity) && (
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full flex items-center gap-2">
                Preço: {filters.priceMin} - {filters.priceMax === Infinity ? '+' : filters.priceMax} Kz
                <button
                  onClick={() => onPriceChange(0, Infinity)}
                  className="hover:text-purple-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.category && (
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full flex items-center gap-2">
                Categoria: {categoryOptions.find((o) => o.value === filters.category)?.label}
                <button
                  onClick={() => onFilterChange('category', null)}
                  className="hover:text-purple-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.rating && (
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full flex items-center gap-2">
                Avaliação: {filters.rating}+ Estrelas
                <button
                  onClick={() => onFilterChange('rating', null)}
                  className="hover:text-purple-900"
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
