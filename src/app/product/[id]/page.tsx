import { notFound } from 'next/navigation';
import ProductPage from '../../../home/ProductPage';
import { ProductReviews } from '@/components/reviews/ProductReviews';
import { createClient } from '@/lib/supabase/server';
import { getProductDetail } from '@/lib/products/getProductDetail';

type ProductPageRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: ProductPageRouteProps) {
  const { id } = await params;
  const [supabase, product] = await Promise.all([createClient(), getProductDetail(id)]);

  if (!product) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <ProductPage product={product} currentUserId={user?.id ?? null} />
      <ProductReviews productId={product.id} />
    </>
  );
}
