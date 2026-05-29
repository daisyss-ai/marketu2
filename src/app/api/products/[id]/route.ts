<<<<<<< HEAD
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mockProducts } from '../_mock';
=======
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
>>>>>>> ff11d56e553d74f50fbb214921fd55f055035864

export const runtime = 'nodejs';

type MediaAddItem = {
  url?: unknown;
  filename?: unknown;
  size_bytes?: unknown;
  position?: unknown;
  is_preview?: unknown;
};

type PatchBody = {
  title?: unknown;
  description?: unknown;
  category_id?: unknown;
  condition?: unknown;
  price?: unknown;
  is_free?: unknown;
  quantity?: unknown;
  is_active?: unknown;
  media_add?: unknown;
  media_remove_ids?: unknown;
};

function asString(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
<<<<<<< HEAD
  return s || null;
}

function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  if (!isSupabaseConfigured()) {
    const product = mockProducts.find((item) => String(item.id) === String(id));
    if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    return NextResponse.json({ data: product }, { status: 200 });
  }

  const supabase = await createClient();

  const { data: searchViewRow } = await supabase
    .from('products_search_view')
    .select('id,title,category,price,seller,img,description,condition,location,subject,grade_level,product_type,rating,reviews,created_at,user_id')
    .eq('id', id)
    .maybeSingle();

  if (searchViewRow) {
    return NextResponse.json(
      {
        data: {
          id: searchViewRow.id,
          title: searchViewRow.title,
          category: searchViewRow.category,
          price: searchViewRow.price,
          seller: searchViewRow.seller,
          img: searchViewRow.img,
          description: searchViewRow.description ?? undefined,
          condition: searchViewRow.condition ?? undefined,
          location: searchViewRow.location ?? undefined,
          subject: searchViewRow.subject ?? undefined,
          gradeLevel: searchViewRow.grade_level ?? undefined,
          productType: searchViewRow.product_type ?? undefined,
          rating: searchViewRow.rating ?? undefined,
          reviews: searchViewRow.reviews ?? undefined,
          createdAt: searchViewRow.created_at ?? undefined,
          userId: searchViewRow.user_id ?? undefined,
        },
      },
      { status: 200 }
    );
  }

  const { data, error } = await supabase
    .from('products')
    .select('id,title,price,type,seller_id,rating,total_reviews,created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });

  return NextResponse.json(
    {
      data: {
        id: data.id,
        title: data.title,
        category: 'geral',
        price: data.price ?? 0,
        seller: data.seller_id,
        img: '',
        rating: data.rating ?? undefined,
        reviews: data.total_reviews ?? undefined,
        createdAt: data.created_at ?? undefined,
        userId: data.seller_id,
        productType: data.type === 'service' ? 'servico' : 'material',
      },
    },
    { status: 200 }
  );
=======
  return s ? s : null;
>>>>>>> ff11d56e553d74f50fbb214921fd55f055035864
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await params;
<<<<<<< HEAD
    if (!productId) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
=======
    if (!productId) return NextResponse.json({ error: 'ID invÃ¡lido' }, { status: 400 });
>>>>>>> ff11d56e553d74f50fbb214921fd55f055035864

    const body = (await req.json().catch(() => null)) as PatchBody | null;

    const supabase = await createClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) return NextResponse.json({ error: authError.message }, { status: 401 });
<<<<<<< HEAD
    if (!auth?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
=======
    if (!auth?.user) return NextResponse.json({ error: 'NÃ£o autenticado' }, { status: 401 });
>>>>>>> ff11d56e553d74f50fbb214921fd55f055035864

    const userId = auth.user.id;

    const { data: existing, error: existingError } = await supabase
      .from('products')
      .select('id,seller_id')
      .eq('id', productId)
      .maybeSingle();

    if (existingError) return NextResponse.json({ error: existingError.message }, { status: 400 });
<<<<<<< HEAD
    if (!existing?.id) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    if (existing.seller_id !== userId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
=======
    if (!existing?.id) return NextResponse.json({ error: 'Produto nÃ£o encontrado' }, { status: 404 });
    if (existing.seller_id !== userId) return NextResponse.json({ error: 'Sem permissÃ£o' }, { status: 403 });
>>>>>>> ff11d56e553d74f50fbb214921fd55f055035864

    const updates: Record<string, unknown> = {};

    if (body && 'title' in body) {
      const title = String(body.title ?? '').trim();
<<<<<<< HEAD
      if (!title) return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
      if (title.length > 100) return NextResponse.json({ error: 'Título deve ter no máximo 100 caracteres' }, { status: 400 });
=======
      if (!title) return NextResponse.json({ error: 'TÃ­tulo Ã© obrigatÃ³rio' }, { status: 400 });
      if (title.length > 100) return NextResponse.json({ error: 'TÃ­tulo deve ter no mÃ¡ximo 100 caracteres' }, { status: 400 });
>>>>>>> ff11d56e553d74f50fbb214921fd55f055035864
      updates.title = title;
    }

    if (body && 'description' in body) {
      const description = String(body.description ?? '').trim();
      if (description.length < 20 || description.length > 500) {
<<<<<<< HEAD
        return NextResponse.json({ error: 'Descrição deve ter entre 20 e 500 caracteres' }, { status: 400 });
=======
        return NextResponse.json({ error: 'DescriÃ§Ã£o deve ter entre 20 e 500 caracteres' }, { status: 400 });
>>>>>>> ff11d56e553d74f50fbb214921fd55f055035864
      }
      updates.description = description;
    }

    if (body && 'category_id' in body) {
      const category_id = typeof body.category_id === 'string' && body.category_id.trim() ? body.category_id.trim() : null;
      updates.category_id = category_id;
    }

    if (body && 'condition' in body) {
      const conditionRaw = body.condition;
      const condition =
        conditionRaw === 'digital' || conditionRaw === 'new' || conditionRaw === 'used' ? conditionRaw : null;
<<<<<<< HEAD
      if (!condition) return NextResponse.json({ error: 'Condição inválida' }, { status: 400 });
=======
      if (!condition) return NextResponse.json({ error: 'CondiÃ§Ã£o invÃ¡lida' }, { status: 400 });
      // Keep in sync with DB enum `product_type`
>>>>>>> ff11d56e553d74f50fbb214921fd55f055035864
      updates.type = condition === 'digital' ? 'digital_material' : 'physical_product';
    }

    let is_free: boolean | null = null;
    if (body && 'is_free' in body) {
<<<<<<< HEAD
      const value = body.is_free;
      if (typeof value === 'boolean') is_free = value;
      else if (value === 'true') is_free = true;
      else if (value === 'false') is_free = false;
      if (is_free === null) return NextResponse.json({ error: 'Campo is_free inválido' }, { status: 400 });
=======
      const v = body.is_free;
      if (typeof v === 'boolean') is_free = v;
      else if (v === 'true') is_free = true;
      else if (v === 'false') is_free = false;
      else is_free = null;
      if (is_free === null) return NextResponse.json({ error: 'Campo is_free invÃ¡lido' }, { status: 400 });
>>>>>>> ff11d56e553d74f50fbb214921fd55f055035864
      updates.is_free = is_free;
    }

    if (body && 'price' in body) {
      const priceRaw = body.price;
      const priceNum = typeof priceRaw === 'number' ? priceRaw : Number(priceRaw ?? NaN);
<<<<<<< HEAD
      if (!Number.isFinite(priceNum) || priceNum < 0) return NextResponse.json({ error: 'Preço inválido' }, { status: 400 });
=======
      if (!Number.isFinite(priceNum) || priceNum < 0) return NextResponse.json({ error: 'PreÃ§o invÃ¡lido' }, { status: 400 });
>>>>>>> ff11d56e553d74f50fbb214921fd55f055035864
      updates.price = is_free === true ? 0 : priceNum;
    } else if (is_free === true) {
      updates.price = 0;
    }

    if (body && 'is_active' in body) {
<<<<<<< HEAD
      const value = body.is_active;
      if (typeof value !== 'boolean') return NextResponse.json({ error: 'Campo is_active inválido' }, { status: 400 });
      updates.is_active = value;
=======
      const v = body.is_active;
      if (typeof v !== 'boolean') return NextResponse.json({ error: 'Campo is_active invÃ¡lido' }, { status: 400 });
      updates.is_active = v;
>>>>>>> ff11d56e553d74f50fbb214921fd55f055035864
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId)
        .eq('seller_id', userId);

      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    if (body && 'quantity' in body) {
<<<<<<< HEAD
      const quantityRaw = body.quantity;
      const quantityNum = typeof quantityRaw === 'number' ? quantityRaw : Number(quantityRaw ?? NaN);
      if (!Number.isFinite(quantityNum) || quantityNum < 0) return NextResponse.json({ error: 'Quantidade inválida' }, { status: 400 });
      const quantity = Math.floor(quantityNum);
=======
      const qRaw = body.quantity;
      const qNum = typeof qRaw === 'number' ? qRaw : Number(qRaw ?? NaN);
      if (!Number.isFinite(qNum) || qNum < 0) return NextResponse.json({ error: 'Quantidade invÃ¡lida' }, { status: 400 });
      const quantity = Math.floor(qNum);
>>>>>>> ff11d56e553d74f50fbb214921fd55f055035864
      const { error: stockError } = await supabase
        .from('product_stock')
        .upsert({ product_id: productId, quantity }, { onConflict: 'product_id' });
      if (stockError) return NextResponse.json({ error: stockError.message }, { status: 400 });
    }

    const removeIds =
<<<<<<< HEAD
      Array.isArray(body?.media_remove_ids) ? body.media_remove_ids.filter((value) => typeof value === 'string') : [];
    if (removeIds.length > 0) {
      const { error: removeError } = await supabase
        .from('product_media')
        .delete()
        .in('id', removeIds)
        .eq('product_id', productId);
      if (removeError) return NextResponse.json({ error: removeError.message }, { status: 400 });
    }

    const mediaAdd = Array.isArray(body?.media_add) ? (body.media_add as MediaAddItem[]) : [];
=======
      Array.isArray(body?.media_remove_ids) ? body?.media_remove_ids.filter((v) => typeof v === 'string') : [];
    if (removeIds.length > 0) {
      const { error: removeError } = await supabase.from('product_media').delete().in('id', removeIds).eq('product_id', productId);
      if (removeError) return NextResponse.json({ error: removeError.message }, { status: 400 });
    }

    const mediaAdd = Array.isArray(body?.media_add) ? (body!.media_add as MediaAddItem[]) : [];
>>>>>>> ff11d56e553d74f50fbb214921fd55f055035864
    if (mediaAdd.length > 0) {
      const { data: lastPosRow } = await supabase
        .from('product_media')
        .select('position')
        .eq('product_id', productId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle();

      const startPos = typeof lastPosRow?.position === 'number' ? lastPosRow.position + 1 : 0;

<<<<<<< HEAD
      const wantsPreview = mediaAdd.some((media) => media?.is_preview === true);
      if (wantsPreview) {
        const { error: resetError } = await supabase
          .from('product_media')
          .update({ is_preview: false })
          .eq('product_id', productId);
        if (resetError) return NextResponse.json({ error: resetError.message }, { status: 400 });
      }

      const rows = mediaAdd.map((media, index) => {
        const url = asString(media?.url);
        if (!url) throw new Error('URL de mídia inválida');

        const filename = typeof media.filename === 'string' ? media.filename : null;
        const sizeBytesRaw = media.size_bytes;
        const size_bytes = typeof sizeBytesRaw === 'number' && Number.isFinite(sizeBytesRaw) ? Math.floor(sizeBytesRaw) : null;

        const positionRaw = media.position;
        const position =
          typeof positionRaw === 'number' && Number.isFinite(positionRaw) ? Math.floor(positionRaw) : startPos + index;
=======
      const wantsPreview = mediaAdd.some((m) => m?.is_preview === true);
      if (wantsPreview) {
        const { error: resetError } = await supabase.from('product_media').update({ is_preview: false }).eq('product_id', productId);
        if (resetError) return NextResponse.json({ error: resetError.message }, { status: 400 });
      }

      const rows = mediaAdd.map((m, idx) => {
        const url = asString(m?.url);
        if (!url) throw new Error('URL de mÃ­dia invÃ¡lida');

        const filename = typeof m.filename === 'string' ? m.filename : null;
        const sizeBytesRaw = m.size_bytes;
        const size_bytes = typeof sizeBytesRaw === 'number' && Number.isFinite(sizeBytesRaw) ? Math.floor(sizeBytesRaw) : null;

        const positionRaw = m.position;
        const position =
          typeof positionRaw === 'number' && Number.isFinite(positionRaw) ? Math.floor(positionRaw) : startPos + idx;

        const is_preview = m.is_preview === true;
>>>>>>> ff11d56e553d74f50fbb214921fd55f055035864

        return {
          product_id: productId,
          url,
          media_type: 'image',
          filename,
          size_bytes,
          position,
<<<<<<< HEAD
          is_preview: media.is_preview === true,
=======
          is_preview,
>>>>>>> ff11d56e553d74f50fbb214921fd55f055035864
        };
      });

      const { error: addError } = await supabase.from('product_media').insert(rows);
      if (addError) return NextResponse.json({ error: addError.message }, { status: 400 });
    }

<<<<<<< HEAD
=======
    // Guarantee a preview image when media exists.
>>>>>>> ff11d56e553d74f50fbb214921fd55f055035864
    const { data: previewRow, error: previewError } = await supabase
      .from('product_media')
      .select('id')
      .eq('product_id', productId)
      .eq('is_preview', true)
      .maybeSingle();
    if (previewError) return NextResponse.json({ error: previewError.message }, { status: 400 });

    if (!previewRow?.id) {
      const { data: firstMedia, error: firstMediaError } = await supabase
        .from('product_media')
        .select('id')
        .eq('product_id', productId)
        .order('position', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (firstMediaError) return NextResponse.json({ error: firstMediaError.message }, { status: 400 });
      if (firstMedia?.id) {
        const { error: setPreviewError } = await supabase
          .from('product_media')
          .update({ is_preview: true })
          .eq('id', firstMedia.id)
          .eq('product_id', productId);
        if (setPreviewError) return NextResponse.json({ error: setPreviewError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ data: { id: productId } });
<<<<<<< HEAD
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno';
=======
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Erro interno';
>>>>>>> ff11d56e553d74f50fbb214921fd55f055035864
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await params;
<<<<<<< HEAD
    if (!productId) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
=======
    if (!productId) return NextResponse.json({ error: 'ID invÃ¡lido' }, { status: 400 });
>>>>>>> ff11d56e553d74f50fbb214921fd55f055035864

    const supabase = await createClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) return NextResponse.json({ error: authError.message }, { status: 401 });
<<<<<<< HEAD
    if (!auth?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const userId = auth.user.id;

    const { error: delError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('seller_id', userId);
    if (delError) return NextResponse.json({ error: delError.message }, { status: 400 });

    return NextResponse.json({ data: { id: productId } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno';
=======
    if (!auth?.user) return NextResponse.json({ error: 'NÃ£o autenticado' }, { status: 401 });

    const userId = auth.user.id;

    const { error: delError } = await supabase.from('products').delete().eq('id', productId).eq('seller_id', userId);
    if (delError) return NextResponse.json({ error: delError.message }, { status: 400 });

    return NextResponse.json({ data: { id: productId } });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Erro interno';
>>>>>>> ff11d56e553d74f50fbb214921fd55f055035864
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
