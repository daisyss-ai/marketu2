# Product Search Architecture

## Objetivo

O search de produtos foi reorganizado para um fluxo modular, tipado e preparado para escalar:

```text
src/app/api/products/_search/
├── index.ts
├── filters.ts
├── sorting.ts
├── pagination.ts
├── fulltext.ts
├── ranking.ts
├── suggestions.ts
└── types.ts
```

## Responsabilidades

- `types.ts`: contrato compartilhado de query, meta, paginação e sugestões.
- `fulltext.ts`: normalização, tokenização e construção de cláusulas textuais.
- `filters.ts`: aplicação de filtros no Supabase e fallback em memória.
- `ranking.ts`: score de relevância.
- `sorting.ts`: ordenação consistente para banco e fallback local.
- `pagination.ts`: meta de paginação e slicing.
- `suggestions.ts`: autocomplete deduplicado.
- `index.ts`: orquestração e mapeamento de rows do banco para o shape do frontend.

## Contrato da API

### `GET /api/products`

Query params suportados:

- `search`
- `category`
- `condition`
- `gradeLevel`
- `subject`
- `productType`
- `location`
- `rating`
- `minPrice`
- `maxPrice`
- `sort`: `relevance | newest | price_asc | price_desc | rating`
- `page`
- `limit`

Resposta:

```json
{
  "data": {
    "products": [],
    "total": 0,
    "page": 1,
    "limit": 12,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false,
    "sort": "newest",
    "appliedFilters": {},
    "meta": {
      "pagination": {
        "page": 1,
        "limit": 12,
        "total": 0,
        "totalPages": 1,
        "hasNextPage": false,
        "hasPrevPage": false,
        "offset": 0,
        "to": 12
      },
      "sort": "newest",
      "appliedFilters": {}
    }
  }
}
```

### `GET /api/products/suggest`

Query params:

- `q`
- `limit`

Resposta:

```json
{
  "data": {
    "suggestions": [
      { "type": "product", "value": "Livro de Matemática", "label": "Livro de Matemática" }
    ]
  }
}
```

## Comportamento atual

- Busca textual principal usa `RPC` PostgreSQL (`search_products_v1`) com `websearch_to_tsquery('portuguese', ...)`.
- Existe fallback para `.textSearch('search_vector', ...)` quando a RPC ainda não foi aplicada no banco.
- Mock fallback continua suportado quando Supabase ou a tabela `products` não existem.
- Frontend consome um contrato único com `meta` de paginação e filtros aplicados.
- Autocomplete usa debounce reutilizável e cancelamento com `AbortController`.

## Infraestrutura SQL

O search full-text agora depende da migração [supabase/migrations/20260512_product_search_v1.sql](/c:/Users/HP/Imagens_Local/marketu2/supabase/migrations/20260512_product_search_v1.sql:1), que cria:

- `search_vector`
- trigger automática de atualização
- índices `GIN` para `tsvector`
- índices `pg_trgm` para campos textuais quentes
- função RPC `search_products_v1`

## SQL aplicado

```sql
create extension if not exists pg_trgm;

alter table public.products
add column if not exists search_vector tsvector
generated always as (
  setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(category, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(subject, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(location, '')), 'C') ||
  setweight(to_tsvector('simple', coalesce(description, '')), 'D')
) stored;

create index if not exists products_search_vector_idx
on public.products using gin (search_vector);

create index if not exists products_title_trgm_idx
on public.products using gin (title gin_trgm_ops);
```

## Observação de rollout

Depois de aplicar a migração no Supabase, a rota `GET /api/products` passa a usar a RPC como caminho principal para ranking, filtros, ordenação e paginação no banco.
