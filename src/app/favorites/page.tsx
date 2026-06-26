import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import FavoritesPage from '@/home/FavoritesPage';
import { getSavedProducts } from '@/lib/saved/getSavedProducts';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const savedProducts = await getSavedProducts(user.id);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FavoritesPage savedProducts={savedProducts} />
    </Suspense>
  );
}