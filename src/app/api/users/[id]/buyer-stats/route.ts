import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const supabase = await createClient();

    const { data: reviews, error } = await supabase
      .from('user_reviews')
      .select('rating, badges, created_at')
      .eq('reviewed_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const total = reviews?.length || 0;
    const avgRating = total > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10
      : 0;

    // Contar badges
    const badgeCounts: Record<string, number> = {};
    for (const review of reviews ?? []) {
      for (const badge of review.badges ?? []) {
        badgeCounts[badge] = (badgeCounts[badge] || 0) + 1;
      }
    }

    return NextResponse.json({
      data: {
        avgRating,
        total,
        badgeCounts,
      },
    });
  } catch (error) {
    console.error('Error fetching buyer stats:', error);
    return NextResponse.json({
      data: { avgRating: 0, total: 0, badgeCounts: {} },
    });
  }
}