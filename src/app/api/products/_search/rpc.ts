import type { Product } from '../../../../types';
import type { ProductRow, ProductSearchQuery } from './types';
import { buildSearchMeta, mapProductRow } from './mapping';
import { buildSearchProductsRpcParams } from './query-builder';
import type { SupabaseClient } from '@supabase/supabase-js';


// ✅ Exportar o tipo — estava a faltar o export
export type RpcSearchResult = {
  products: Product[];
  meta: ReturnType<typeof buildSearchMeta>;
};

export async function searchProductsWithRpc(
  client: SupabaseClient,
  query: ProductSearchQuery
): Promise<RpcSearchResult> {
  
  // ✅ Sem .returns<T>() — tipar o resultado manualmente depois
  const { data, error } = await client.rpc('search_products_v1', buildSearchProductsRpcParams(query));

  if (error) {
    throw new Error(error.message);
  }

  // ✅ Cast explícito após o await, fora da chain do Supabase
  const rows = (data || []) as Array<ProductRow & {
    search_rank?: number | null;
    total_count?: number | null;
  }>;

  const products = rows.map((row) => {
    const product = mapProductRow(row);
    return {
      ...product,
      searchScore: row.search_rank ?? undefined,
    };
  });

  const total = rows[0]?.total_count ?? 0;

  return {
    products,
    meta: buildSearchMeta(query, total),
  };
}