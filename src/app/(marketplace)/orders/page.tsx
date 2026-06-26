import { Suspense, type ComponentProps } from 'react';
import { redirect } from 'next/navigation';
import OrdersPage from '@/home/OrdersPage';
import { getBuyerOrders, getSellerOrders } from '@/lib/orders/getOrders';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function OrdersContent(props: ComponentProps<typeof OrdersPage>) {
  return <OrdersPage {...props} />;
}

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [buyerOrders, sellerOrders] = await Promise.all([
    getBuyerOrders(user.id),
    getSellerOrders(user.id),
  ]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrdersContent
        buyerOrders={buyerOrders}
        sellerOrders={sellerOrders}
        currentUserId={user.id}
      />
    </Suspense>
  );
}