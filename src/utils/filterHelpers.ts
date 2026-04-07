/**
 * Helper functions for filtering, sorting, and formatting products
 */

export const formatPrice = (price) => {
  if (typeof price !== 'number') return price;
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
  }).format(price);
};

export const formatPriceShort = (price) => {
  if (typeof price !== 'number') return price;
  return price.toLocaleString('pt-AO');
};

export const conditionLabels = {
  novo: 'Novo',
  como_novo: 'Como Novo',
  usado: 'Usado',
};

export const categoryLabels = {
  material_escolar: 'Material Escolar',
  tecnologia: 'Tecnologia',
  livros: 'Livros',
  roupas: 'Roupas e Acessórios',
  servicos: 'Serviços',
  outros: 'Outros',
};

export const sortLabels = {
  newest: 'Mais Recentes',
  price_asc: 'Menor Preço',
  price_desc: 'Maior Preço',
  rating: 'Melhores Avaliações',
};

export const buildQueryString = (filters, sorting, page) => {
  const params = new URLSearchParams();

  if (filters?.condition) params.set('condition', filters.condition);
  if (filters?.category) params.set('category', filters.category);
  if (filters?.priceMin && filters.priceMin > 0) params.set('priceMin', filters.priceMin);
  if (filters?.priceMax && filters.priceMax !== Infinity) params.set('priceMax', filters.priceMax);
  if (filters?.rating) params.set('rating', filters.rating);
  if (filters?.searchTerm) params.set('search', filters.searchTerm);
  if (sorting && sorting !== 'newest') params.set('sort', sorting);
  if (page && page > 1) params.set('page', page);

  return params.toString();
};

export const getActiveFiltersCount = (filters) => {
  let count = 0;
  if (filters.condition) count++;
  if (filters.category) count++;
  if (filters.rating) count++;
  if (filters.searchTerm) count++;
  if (filters.priceMin > 0 || filters.priceMax !== Infinity) count++;
  return count;
};

export const hasAnyActiveFilter = (filters) => {
  return (
    filters.condition !== null ||
    filters.category !== null ||
    filters.rating !== null ||
    filters.searchTerm !== '' ||
    filters.priceMin > 0 ||
    filters.priceMax !== Infinity
  );
};

export const getStockStatus = (stock) => {
  if (stock > 5) return { label: 'Em stock', color: 'bg-green-400' };
  if (stock > 0) return { label: 'Poucas unidades', color: 'bg-red-400' };
  return { label: 'Fora de stock', color: 'bg-gray-400' };
};
