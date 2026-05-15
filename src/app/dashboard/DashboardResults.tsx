import { createClient } from '@/lib/supabase/server';
import SellerProductCard from './SellerProductCard';

type DbCategory = { name: string | null } | null;
type DbMedia = { url: string | null; is_preview: boolean | null; position: number | null } | null;
type DbStock = { quantity: number | null } | null;
type DbModeration = { status: string | null } | null;

type DbRow = {
  id: string;
  seller_id: string;
  category_id: string | null;
  type: string;
  title: string;
  description: string | null;
  price: number | string | null;
  is_free: boolean | null;
  is_active: boolean | null;
  is_approved: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  categories: DbCategory | DbCategory[] | null;
  product_media: DbMedia[] | null;
  product_stock: DbStock | DbStock[] | null;
  content_moderation: DbModeration | DbModeration[] | null;
};

function toAppType(dbType: string): 'physical' | 'digital' | 'service' {
  if (dbType === 'digital_material') return 'digital';
  if (dbType === 'physical_product') return 'physical';
  return 'service';
}

function pickPreviewUrl(media: DbMedia[] | null): string | null {
  const list = Array.isArray(media) ? media.filter(Boolean) : [];
  const cover = list.find((m) => m?.is_preview) || list[0] || null;
  return cover?.url ?? null;
}

export default async function DashboardResults() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;

  if (!userId) {
    return (
      <div className="max-w-6xl mx-auto px-6 pb-12">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-sm text-gray-700">
          Precisa iniciar sessÃ£o para ver o dashboard.
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
        is_approved,
        created_at,
        updated_at,
        categories(name),
        product_media(url,is_preview,position),
        product_stock(quantity),
        content_moderation(status)
      `
    )
    .eq('seller_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-6 pb-12">
        <div className="bg-white border border-red-200 rounded-2xl p-6 text-sm text-red-700">
          Erro ao carregar produtos: {error.message}
        </div>
      </div>
    );
  }

  const rows = (data ?? []) as DbRow[];
  const products = rows.map((p) => {
    const category = p.categories;
    const category_name = Array.isArray(category) ? category[0]?.name ?? null : category?.name ?? null;

    const stockRow = Array.isArray(p.product_stock) ? p.product_stock[0] : p.product_stock;
    const stock = stockRow?.quantity ?? null;

    const moderationRow = Array.isArray(p.content_moderation) ? p.content_moderation[0] : p.content_moderation;
    const moderation_status = moderationRow?.status ?? null;

    return {
      ...p,
      type: toAppType(p.type),
      preview_url: pickPreviewUrl(p.product_media),
      stock,
      moderation_status,
      category_name,
    };
  });

  if (products.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-6 pb-12">
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <div className="text-lg font-semibold text-gray-900 mb-1">Nenhum produto ainda</div>
          <div className="text-sm text-gray-600">Clique em “+ Novo produto” para publicar o primeiro.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => (
          <SellerProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
