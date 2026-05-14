import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const body = await req.json();

    const { data: user, error } = await supabase
      .from('users')
      .update(body)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao atualizar perfil' },
        { status: 400 }
      );
    }

    return NextResponse.json(user);
  } catch {
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil' },
      { status: 500 }
    );
  }
}
