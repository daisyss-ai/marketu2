import { createClient } from '@/lib/supabase/server';
import EditProductForm from './ui/EditProductForm';

export const dynamic = 'force-dynamic';

type DbMedia = {
  id: string;
  url: string | null;
  filename: string | null;
  position: number | null;
  is_preview: boolean | null;
} | null;

type DbStock = { quantity: number | null } | null;

type DbProduct = {
  id: string;
  seller_id: string;
  category_id: string | null;
  type: string;
  title: string;
  description: string | null;
  price: number | string | null;
  is_free: boolean | null;
  is_active: boolean | null;
};

export default async function Page({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const supabase = await createClient();

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto px-6 pt-10 pb-16">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-sm text-gray-700">
            Precisa iniciar sessÃ£o para editar um produto.
          </div>
        </div>
      </div>
    );
  }

  const { data, error } = await supabase
    .from('products')
    .select(
      `
        id,
        seller_id,
        category_id,
        type,
        title,
        description,
        price,
        is_free,
        is_active,
        product_media(id,url,filename,position,is_preview),
        product_stock(quantity)
      `
    )
    .eq('id', productId)
    .eq('seller_id', userId)
    .maybeSingle();

  if (error || !data?.id) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto px-6 pt-10 pb-16">
          <div className="bg-white border border-red-200 rounded-2xl p-6 text-sm text-red-700">
            {error?.message || 'Produto nÃ£o encontrado'}
          </div>
        </div>
      </div>
    );
  }

  const product = data as unknown as DbProduct & {
    product_media: DbMedia[] | null;
    product_stock: DbStock | DbStock[] | null;
  };

  const stockRow = Array.isArray(product.product_stock) ? product.product_stock[0] : product.product_stock;
  const quantity = stockRow?.quantity ?? 1;

  const media = Array.isArray(product.product_media)
    ? product.product_media
        .filter(Boolean)
        .map((m) => ({
          id: m!.id,
          url: m!.url ?? '',
          filename: m!.filename,
          position: m!.position ?? 0,
          is_preview: !!m!.is_preview,
        }))
        .sort((a, b) => a.position - b.position)
    : [];

  return (
    <div className="bg-gray-50 min-h-screen">
      <EditProductForm
        product={{
          id: product.id,
          seller_id: product.seller_id,
          category_id: product.category_id,
          type: product.type === 'digital_material' ? 'digital' : product.type === 'physical_product' ? 'physical' : 'service',
          title: product.title,
          description: product.description ?? '',
          price: typeof product.price === 'number' ? product.price : Number(product.price ?? 0),
          is_free: !!product.is_free,
          is_active: product.is_active ?? true,
          quantity,
          media,
        }}
      />
    </div>
  );
}
