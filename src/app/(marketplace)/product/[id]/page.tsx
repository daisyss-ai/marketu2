import { Suspense, type ComponentProps } from 'react';
import { notFound } from 'next/navigation';
import ProductPage from '@/home/ProductPage';
import { ProductReviews } from '@/components/reviews/ProductReviews';
import { createClient } from '@/lib/supabase/server';
import { getProductDetail } from '@/lib/products/getProductDetail';

type ProductPageRouteProps = {
  params: Promise<{ id: string }>;
};

function ProductContent(props: ComponentProps<typeof ProductPage>) {
  return <ProductPage {...props} />;
}

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
      <Suspense fallback={<div>Loading...</div>}>
        <ProductContent product={product} currentUserId={user?.id ?? null} />
      </Suspense>
      <ProductReviews productId={product.id} />
    </>
  );
}
