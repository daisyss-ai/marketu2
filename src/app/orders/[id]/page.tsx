import OrderDetailPage from '../../../components/cart/OrderDetailPage';

export default function Page({ params }: { params: { id: string } }) {
  return <OrderDetailPage orderId={params.id} />;
}
