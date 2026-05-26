import { redirect } from 'next/navigation';
import OrdersPage from '@/home/OrdersPage';
import { getBuyerOrders, getSellerOrders } from '@/lib/orders/getOrders';
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

  const [buyerOrders, sellerOrders, savedProducts] = await Promise.all([
    getBuyerOrders(user.id),
    getSellerOrders(user.id),
    getSavedProducts(user.id),
  ]);

  return (
    <OrdersPage
      buyerOrders={buyerOrders}
      sellerOrders={sellerOrders}
      currentUserId={user.id}
      savedProducts={savedProducts}
    />
  );
}
