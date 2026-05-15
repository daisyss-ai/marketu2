import { redirect } from 'next/navigation';
import OrdersPage from '@/home/OrdersPage';
import { getOrders } from '@/lib/orders/getOrders';
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

  const orders = await getOrders(user.id);

  return <OrdersPage orders={orders} />;
}
