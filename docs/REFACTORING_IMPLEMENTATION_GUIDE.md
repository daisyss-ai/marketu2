/**
 * @file IMPLEMENTATION GUIDE - MarketU v2 Search Refactoring
 * @description Guia passo-a-passo para implementar a refatoração profissional
 * 
 * Este documento é a "bíblia" da refatoração.
 * Segue esta ordem para evitar problemas.
 */

# 🚀 GUIA DE IMPLEMENTAÇÃO - REFATORAÇÃO PROFISSIONAL

## FASE 1: SETUP (1-2 horas)

### 1.1 Instalar Dependências

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install --save-dev @types/react-query
```

### 1.2 Atualizar package.json (verificar versões)

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.40.0",
    "@tanstack/react-query-devtools": "^5.40.0",
    "zustand": "^5.0.12",
    "@supabase/supabase-js": "^2.101.0"
  }
}
```

### 1.3 Verificar Estrutura de Pastas

```bash
# Criar diretórios base
mkdir -p src/lib/{constants,database/queries,services,search,utils}
mkdir -p src/hooks/{queries,filters,search}
mkdir -p src/types

# Confirmar arquivos foram criados (veja lista abaixo)
```

## FASE 2: TIPOS & CONSTANTES (1 hora)

✅ Já criados:
- `src/types/search.ts` - Tipos principais
- `src/types/products.ts` - Tipos de produtos
- `src/types/filters.ts` - Tipos de filtros
- `src/types/api.ts` - Tipos de API
- `src/lib/constants/search.ts` - Constantes

## FASE 3: UTILITÁRIOS (30 minutos)

✅ Já criados:
- `src/lib/utils/url-sync.ts` - Sincronização com URL
- `src/lib/search/ranking.ts` - Algoritmo de ranking
- `src/lib/services/cache-key.ts` - Cache key factory
- `src/lib/services/query-client.ts` - React Query setup

## FASE 4: DATABASE (1-2 horas)

✅ Já criados:
- `src/lib/database/migrations/001_create_indexes.sql` - Índices
- `src/lib/database/queries/products.ts` - Queries otimizadas

### 4.1 Executar Migrations

```bash
# 1. Abrir dashboard Supabase
# 2. SQL Editor -> Nova Query
# 3. Copiar conteúdo de src/lib/database/migrations/001_create_indexes.sql
# 4. Executar

# OU via CLI
supabase migration up 001_create_indexes
```

### 4.2 Verificar Índices

```sql
-- Verificar índices criados
SELECT * FROM pg_indexes WHERE tablename = 'products';

-- Deve mostrar ~12 índices
```

## FASE 5: REACT QUERY SETUP (30 minutos)

### 5.1 Atualizar layout.tsx (root)

```tsx
// src/app/layout.tsx
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createQueryClient } from '@/lib/services/query-client';
import type { ReactNode } from 'react';

const queryClient = createQueryClient();

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="pt-AO">
      <head>
        {/* ... existing head content ... */}
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
          {/* DevTools (remover em produção) */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

## FASE 6: HOOKS (1-2 horas)

✅ Já criados:
- `src/hooks/queries/useProducts.ts` - Hook de busca
- `src/hooks/queries/useSuggestions.ts` - Hook de sugestões
- `src/hooks/filters/useProductFilters.ts` - Hook de filtros

## FASE 7: API ROUTES (1 hora)

✅ Já criados:
- `src/app/api/products/search/route.ts` - POST /api/products/search
- 🟡 Atualizar: `src/app/api/products/suggest/route.ts`

### 7.1 Atualizar Route GET /api/products

```typescript
// src/app/api/products/route.ts
// Adicionar suporte para POST
// (Mantém GET existente, adiciona POST)

export async function POST(request: NextRequest) {
  // Ver arquivo: src/app/api/products/search/route.ts
}
```

## FASE 8: COMPONENTES (2-3 horas)

✅ Já criados (refatorados):
- `src/components/search/SearchBar.refactored.tsx` - SearchBar otimizada
- `src/components/produtos/ProductGrid.refactored.tsx` - Grid otimizado
- `src/components/produtos/ProductCard.refactored.tsx` - Card otimizado

### 8.1 Copiar Componentes para Pasta Original

```bash
# Se quiser sobrescrever os antigos:
cp src/components/search/SearchBar.refactored.tsx src/components/search/SearchBar.tsx
cp src/components/produtos/ProductGrid.refactored.tsx src/components/produtos/ProductGrid.tsx
cp src/components/produtos/ProductCard.refactored.tsx src/components/produtos/ProductCard.tsx

# OU manter ambos e usar imports condicionais
```

## FASE 9: REFATORAR HOME PAGE (2-3 horas) 🔴 CRÍTICO

### 9.1 Nova Versão de Home.tsx

```tsx
// src/app/home/page.tsx
'use client';

import { useProductFilters } from '@/hooks/filters/useProductFilters';
import { useProducts } from '@/hooks/queries/useProducts';
import { SearchBar } from '@/components/search/SearchBar.refactored';
import { ProductGrid } from '@/components/produtos/ProductGrid.refactored';
import Header from '@/components/layout/Header';

export default function HomePage() {
  // Hooks principais
  const { query, setPage, hasActiveFilters, resetFilters } = useProductFilters();
  const { data, isPending, error } = useProducts(query);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />

      {/* Search Bar */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <SearchBar />
        </div>
      </section>

      {/* Filters Bar (existing component) */}
      {/* ... existing filter component ... */}

      {/* Products Section */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl font-semibold">Produtos</h2>
          
          {hasActiveFilters() && (
            <button
              onClick={resetFilters}
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* Grid com dados de React Query */}
        <ProductGrid
          products={data?.products || []}
          loading={isPending}
          error={error?.message}
          totalProducts={data?.pagination.total || 0}
          page={query.page}
          totalPages={data?.pagination.totalPages || 1}
          onPageChange={setPage}
        />
      </section>
    </div>
  );
}
```

## FASE 10: TESTES (1-2 horas)

### 10.1 Testar Funcionamento

```typescript
// Checklist de testes

// ✅ URL Sync
- Digitar "matematica" -> URL muda para ?q=matematica
- Clicar voltar do browser -> filtros restauram
- Compartilhar URL -> outro browser abre com mesmos filtros

// ✅ Cache React Query
- Carregar página 1
- Ir para página 2
- Voltar para página 1 -> carrega instantaneamente (cache)
- DevTools mostrar cache verde

// ✅ Sugestões
- Digitar 2+ caracteres -> sugestões aparecem
- Menos de 2 caracteres -> sem requisição
- Clicar sugestão -> busca é feita

// ✅ Performance
- Primeira página: < 500ms
- Mudança de filtro: < 100ms (cache)
- Network tab: sem requisições duplicadas

// ✅ Error Handling
- Desativar internet -> erro mostrado
- API error -> erro tratado gracefully
- Reconectar -> refetch automático
```

### 10.2 Verificar DevTools

```
1. Abrir app
2. Devtools F12 -> Network tab
3. Digitar busca -> ver requisição
4. Voltar para filtro anterior -> sem requisição (cache)
5. React Query DevTools -> verde = cache hit
```

## FASE 11: OTIMIZAÇÕES (1 hora)

### 11.1 Code Splitting

```tsx
// Lazy load components pesados
import dynamic from 'next/dynamic';

const ProductGrid = dynamic(() => import('@/components/produtos/ProductGrid'), {
  loading: () => <ProductGridSkeleton />,
});
```

### 11.2 Image Optimization

```tsx
// Usar Next.js Image com lazy loading
import Image from 'next/image';

<Image
  src={product.image}
  alt={product.title}
  width={300}
  height={300}
  loading="lazy"
/>
```

## FASE 12: DEPLOY (30 minutos)

### 12.1 Pre-deploy Checklist

```bash
# ✅ Build local sem erros
npm run build

# ✅ Type check
npx tsc --noEmit

# ✅ Lint
npm run lint

# ✅ Todos os arquivos criados
git status

# ✅ Database migrations aplicadas
supabase migration list | grep applied

# ✅ Environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 12.2 Deploy

```bash
# Se usando Vercel
vercel --prod

# Se usando outro hosting
git push origin main
```

## FASE 13: MONITORAMENTO (Contínuo)

### 13.1 Core Web Vitals

```typescript
// src/app/layout.tsx - Adicionar
import { useReportWebVitals } from 'next/web-vitals';

export function Vitals() {
  useReportWebVitals((metric) => {
    // Enviar para analytics
    console.log(metric);
  });
}
```

### 13.2 Performance Monitoring

```
- React Query DevTools: Verde = cache hits ✅
- Network tab: <100ms por request
- Lighthouse: Score >90
- Core Web Vitals:
  - LCP: < 2.5s
  - FID: < 100ms
  - CLS: < 0.1
```

## ROLLBACK PLAN (Se Algo Der Errado)

```bash
# Reverter para versão antiga
git revert <commit-hash>

# Remover índices (se criar problemas)
supabase migration down 001_create_indexes

# Limpar cache React Query
queryClient.clear()
```

## TROUBLESHOOTING

### Problema: "Reacts hooks called outside components"

```
Solução: Adicionar 'use client' no topo do arquivo
```

### Problema: "Query not found in cache"

```
Solução: Verificar cache keys são iguais
console.log(cacheKeyToString(key))
```

### Problema: "URL não sincroniza"

```
Solução: Confirmar useProductFilters está no component
Confirmar useSearchParams está funcional
Verificar router não está reemplazando history
```

### Problema: "Request duplicado"

```
Solução: React Query deduplicação deveria evitar
Se continua, verificar staleTime/cacheTime settings
```

## NEXT STEPS

Após Phase 13:

1. **Adicionar Redis Cache** (para API)
2. **Implementar Cursor Pagination** (para scroll infinito)
3. **Search Analytics** (o que buscam os usuários)
4. **ML-based Ranking** (machine learning para melhores resultados)
5. **Faceted Search** (filtros dinâmicos)
6. **Full-text Search** (PostgreSQL FTS)

---

**Total Time Estimate**: 12-16 horas (pode variar)

**Team**: 1 Dev Senior
