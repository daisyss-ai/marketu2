import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('id,name,slug,parent_id')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ data: { categories: data ?? [] } });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

