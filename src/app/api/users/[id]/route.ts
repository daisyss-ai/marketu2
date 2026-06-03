import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function normalizeAvatarUrl(value: unknown): { url: string | null; error?: string } {
  if (typeof value !== 'string') return { url: null };
  const avatarUrl = value.trim();
  if (!avatarUrl) return { url: null };
  try {
    const parsed = new URL(avatarUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { url: null, error: 'URL do avatar deve usar http ou https' };
    }
    return { url: parsed.href };
  } catch {
    return { url: null, error: 'URL do avatar inválida' };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function getErrorMeta(error: unknown): { name?: string; code?: string } {
  if (!error || typeof error !== 'object') return {};
  const maybeName = 'name' in error && typeof error.name === 'string' ? error.name : undefined;
  const maybeCode = 'code' in error && typeof error.code === 'string' ? error.code : undefined;
  return { name: maybeName, code: maybeCode };
}

export async function GET(
<<<<<<< HEAD
  _request: Request,
=======
  request: Request,
>>>>>>> main
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const supabase = await createClient();

    const { data: user, error: userError } = await supabase
      .from('students')
      .select(`id, full_name, avatar_url, rating, total_reviews, is_seller`)
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        data: {
          id: userId,
          full_name: 'Usuário',
          avatar_url: null,
          rating: 0,
          total_reviews: 0,
          is_seller: false,
        },
      });
    }

    return NextResponse.json({
      data: {
        id: user.id,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        rating: user.rating,
        total_reviews: user.total_reviews,
        is_seller: user.is_seller,
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
<<<<<<< HEAD
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
=======
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const supabase = await createClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();

    if (authError) return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 401 });
    if (!auth?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (auth.user.id !== userId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const body: unknown = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: 'Dados inválidos para atualização de perfil' }, { status: 400 });
    }

    const allowedFields = new Set(['full_name', 'avatar_url']);
    const updates = Object.fromEntries(
      Object.entries(body).filter(([key]) => allowedFields.has(key))
    ) as Record<string, unknown>;

    if ('avatar_url' in updates) {
      const normalized = normalizeAvatarUrl(updates.avatar_url);
      if (normalized.error) {
        return NextResponse.json({ error: normalized.error }, { status: 400 });
      }
      updates.avatar_url = normalized.url;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo permitido para atualização' }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile', getErrorMeta(error));
      return NextResponse.json({ error: 'Erro ao atualizar perfil no banco de dados' }, { status: 500 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Unexpected error updating user profile', getErrorMeta(error));
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
>>>>>>> main
  }
}