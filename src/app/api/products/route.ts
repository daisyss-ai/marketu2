import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/products/getProducts';
import { createClient } from '@/lib/supabase/server';

function toNumber(v: string | null, fallback: number) {
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const page = Math.max(1, toNumber(searchParams.get('page'), 1));
  const limit = Math.min(48, Math.max(1, toNumber(searchParams.get('limit'), 12)));
  const sortParam = searchParams.get('sort') || 'newest';
  const sort =
    sortParam === 'price_asc' || sortParam === 'price_desc' || sortParam === 'rating' || sortParam === 'newest'
      ? sortParam
      : 'newest';
  const search = (searchParams.get('search') || '').trim();
  const category = (searchParams.get('category') || '').trim(); // expects category slug
  const minRating = Math.max(0, toNumber(searchParams.get('rating'), 0));

  const minPrice = toNumber(searchParams.get('minPrice'), 0);
  const maxPriceRaw = searchParams.get('maxPrice');
  const maxPrice = maxPriceRaw ? toNumber(maxPriceRaw, Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY;

  try {
    const { products, total } = await getProducts({
      page,
      limit,
      sort,
      search,
      categorySlug: category,
      minPrice,
      maxPrice,
      minRating,
    });

    return NextResponse.json({
      data: {
        products,
        total,
        page,
        limit,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const runtime = 'nodejs';

function isProductType(v: unknown): v is 'digital_material' | 'service' | 'physical_product' {
  return v === 'digital_material' || v === 'service' || v === 'physical_product';
}

function isFile(v: unknown): v is File {
  return typeof File !== 'undefined' && v instanceof File;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const title = String(form.get('title') ?? '').trim();
    const descriptionRaw = form.get('description');
    const description = descriptionRaw === null ? null : String(descriptionRaw).trim() || null;
    const categorySlug = String(form.get('category') ?? '').trim();
    const typeRaw = form.get('type');
    const type = isProductType(typeRaw) ? typeRaw : 'physical_product';

    const priceRaw = form.get('price');
    const price = Number(priceRaw ?? 0);

    const images = form
      .getAll('images')
      .filter(isFile)
      .filter((f) => (typeof f.size === 'number' ? f.size > 0 : true));

    if (!title) return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: 'Preço inválido' }, { status: 400 });
    if (images.length === 0) return NextResponse.json({ error: 'Envie pelo menos 1 imagem' }, { status: 400 });
    if (images.length > 5) return NextResponse.json({ error: 'Máximo 5 imagens' }, { status: 400 });

    const supabase = await createClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) return NextResponse.json({ error: authError.message }, { status: 401 });
    if (!auth?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const userId = auth.user.id;

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id,is_seller')
      .eq('id', userId)
      .maybeSingle();

    if (studentError) return NextResponse.json({ error: studentError.message }, { status: 400 });
    if (!student?.id) return NextResponse.json({ error: 'Conta de estudante não encontrada' }, { status: 403 });
    if (student.is_seller === false) return NextResponse.json({ error: 'A sua conta não está habilitada para vender' }, { status: 403 });

    let categoryId: string | null = null;
    if (categorySlug) {
      const { data: cat, error: catError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .maybeSingle();

      if (catError) return NextResponse.json({ error: catError.message }, { status: 400 });
      categoryId = (cat?.id as string | undefined) ?? null;
    }

    const { data: created, error: createError } = await supabase
      .from('products')
      .insert({
        seller_id: userId,
        category_id: categoryId,
        type,
        title,
        description,
        price,
        is_free: price === 0,
        is_active: true,
      })
      .select('id')
      .single();

    if (createError || !created?.id) {
      const message = createError?.message || 'Falha ao criar produto';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const productId = created.id as string;

    // Best-effort stock row (not required for the feed).
    await supabase.from('product_stock').insert({ product_id: productId, quantity: 1 });

    const bucket = 'product-media';

    const uploads: {
      product_id: string;
      url: string;
      media_type: 'image';
      filename: string | null;
      size_bytes: number | null;
      position: number;
      is_preview: boolean;
    }[] = [];

    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const name = (file.name || 'image').toString();
      const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : 'jpg';
      const objectName = `${i + 1}-${crypto.randomUUID()}.${ext}`;
      const path = `${userId}/${productId}/${objectName}`;

      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
        cacheControl: '3600',
      });

      if (uploadError) {
        try {
          await supabase.from('products').delete().eq('id', productId);
        } catch {}
        return NextResponse.json(
          { error: `Falha ao enviar imagem: ${uploadError.message}` },
          { status: 400 }
        );
      }

      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
      uploads.push({
        product_id: productId,
        url: pub.publicUrl,
        media_type: 'image',
        filename: name,
        size_bytes: typeof file.size === 'number' ? file.size : null,
        position: i,
        is_preview: i === 0,
      });
    }

    const { error: mediaError } = await supabase.from('product_media').insert(uploads);
    if (mediaError) {
      try {
        await supabase.from('products').delete().eq('id', productId);
      } catch {}
      return NextResponse.json({ error: mediaError.message }, { status: 400 });
    }

    return NextResponse.json({ data: { id: productId } }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
