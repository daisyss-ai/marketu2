import CartPage from '../../components/cart/CartPage';
import RequireAuth from '../../components/RequireAuth';

export default function Page() {
  return (
    <RequireAuth requireVerified={true}>
      <CartPage />
    </RequireAuth>
  );
}
