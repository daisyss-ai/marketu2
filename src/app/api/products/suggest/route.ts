import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createSupabaseClient } from '../../../../utils/supabase/server';
import { mockProducts } from '../_mock';
import { getSuggestionsFromProducts, mapProductRow } from '../_search';

function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = (searchParams.get('q') || '').trim();
    const limit = Math.min(12, Math.max(1, Number.parseInt(searchParams.get('limit') || '8', 10) || 8));

    if (query.length < 2) {
      return NextResponse.json({ data: { suggestions: [] } }, { status: 200 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { data: { suggestions: getSuggestionsFromProducts(mockProducts, query, limit) } },
        { status: 200 }
      );
    }

    const supabase = await createSupabaseClient();
    const { data, error } = await supabase
  .from('products_search_view')
  .select('*')
  .ilike('title', `%${query}%`)   // fallback simples enquanto search_vector não existe
  .order('created_at', { ascending: false })
  .limit(limit * 3);

    if (error) {
      throw error;
    }

    return NextResponse.json(
      { data: { suggestions: getSuggestionsFromProducts((data || []).map(mapProductRow), query, limit) } },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';

    if (message.toLowerCase().includes('does not exist') || message.toLowerCase().includes('relation')) {
      return NextResponse.json(
        { data: { suggestions: getSuggestionsFromProducts(mockProducts, (request.nextUrl.searchParams.get('q') || '').trim(), 8) } },
        { status: 200 }
      );
    }

    console.error('Suggest API Error:', error);
    return NextResponse.json({ data: { suggestions: [] }, error: message || 'Erro interno' }, { status: 200 });
  }
}
