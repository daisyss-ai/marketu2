import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function normalizeAvatarUrl(value: unknown): { url: string | null; error?: string } {
  if (typeof value !== 'string') {
    return { url: null };
  }

  const avatarUrl = value.trim();
  if (!avatarUrl) {
    return { url: null };
  }

  try {
    const parsed = new URL(avatarUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { url: null, error: 'avatar_url deve usar http ou https' };
    }
    return { url: parsed.href };
  } catch {
    return { url: null, error: 'avatar_url inválida' };
  }
}

function safeErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'Unknown error';
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const supabase = await createClient();

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('students')
      .select(`
        id,
        full_name,
        avatar_url,
        rating,
        total_reviews,
        is_seller,
        users (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('id', userId)
      .single();

    if (userError || !user) {
      // Return mock data for testing if user not found
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const supabase = await createClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) return NextResponse.json({ error: 'Falha na autenticação' }, { status: 401 });
    if (!auth?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (auth.user.id !== userId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const body: unknown = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Dados inválidos para atualização de perfil' },
        { status: 400 }
      );
    }

    const allowedFields = new Set(['full_name', 'avatar_url']);
    const updates = Object.fromEntries(
      Object.entries(body as Record<string, unknown>).filter(([key]) => allowedFields.has(key))
    ) as Record<string, unknown>;

    if ('avatar_url' in updates) {
      const normalized = normalizeAvatarUrl(updates.avatar_url);
      if (normalized.error) {
        return NextResponse.json(
          { error: normalized.error },
          { status: 400 }
        );
      }
      updates.avatar_url = normalized.url;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo permitido para atualização' },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', safeErrorMessage(error));
      return NextResponse.json(
        { error: 'Erro ao atualizar perfil no banco de dados' },
        { status: 500 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Unexpected error updating user profile:', safeErrorMessage(error));
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil' },
      { status: 500 }
    );
  }
}
