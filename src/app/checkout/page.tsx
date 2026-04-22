import CheckoutPage from '../../components/cart/CheckoutPage';
import RequireAuth from '../../components/RequireAuth';

export default function Page() {
  return (
    <RequireAuth requireVerified={true}>
      <CheckoutPage />
    </RequireAuth>
  );
}
