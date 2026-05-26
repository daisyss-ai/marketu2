import { notFound } from 'next/navigation';
import ProductPage from '../../../home/ProductPage';
import { createClient } from '@/lib/supabase/server';
import { getProductDetail } from '@/lib/products/getProductDetail';

type ProductCatchAllPageProps = {
  params: Promise<{ slug: string[] }>;
};

export default async function Page({ params }: ProductCatchAllPageProps) {
  const { slug } = await params;
  const productId = slug[0];

  if (!productId) {
    notFound();
  }

  const [supabase, product] = await Promise.all([createClient(), getProductDetail(productId)]);

  if (!product) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <ProductPage product={product} currentUserId={user?.id ?? null} />;
}
