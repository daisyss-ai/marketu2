import OrdersPage from '../../components/cart/OrdersPage';
import RequireAuth from '../../components/RequireAuth';

export default function Page() {
  return (
    <RequireAuth requireVerified={true}>
      <OrdersPage />
    </RequireAuth>
  );
}
