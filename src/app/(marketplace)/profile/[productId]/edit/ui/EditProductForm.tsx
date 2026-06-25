'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FormAlert, FormFileUpload, FormInput, FormSelect, FormTextarea, LoadingSpinner } from '@/components/FormFields';
import { createClient } from '@/lib/supabase/client';
import type { FormOption, ProductCondition } from '@/types';

type CategoryRow = { id: string; name: string | null };

const CONDITION_OPTIONS: FormOption[] = [
  { label: 'Novo', value: 'new' },
  { label: 'Usado', value: 'used' },
  { label: 'Digital', value: 'digital' },
];

type ExistingMedia = {
  id: string;
  url: string;
  filename: string | null;
  position: number;
  is_preview: boolean;
};

type ProductInput = {
  id: string;
  seller_id: string;
  category_id: string | null;
  type: string;
  title: string;
  description: string;
  price: number;
  is_free: boolean;
  is_active: boolean | null;
  quantity: number;
  media: ExistingMedia[];
};

function toPriceNumber(v: string) {
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

function isAllowedImage(file: File) {
  const allowed = file.type === 'image/jpeg' || file.type === 'image/png';
  const maxBytes = 5 * 1024 * 1024;
  return allowed && file.size <= maxBytes;
}

export default function EditProductForm({ product }: { product: ProductInput }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description);
  const [categoryId, setCategoryId] = useState(product.category_id ?? '');
  const [condition, setCondition] = useState<ProductCondition>(product.type === 'digital' ? 'digital' : 'used');
  const [price, setPrice] = useState(String(product.price ?? 0));
  const isFree = !!product.is_free;
  

  const [existingMedia, setExistingMedia] = useState<ExistingMedia[]>(product.media);
  const [removedMedia, setRemovedMedia] = useState<ExistingMedia[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);

  useEffect(() => {
    let active = true;
    setCategoriesLoading(true);
    setCategoriesError(null);
    fetch('/api/categories', { method: 'GET' })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((json && (json.error || json.message)) || 'Erro ao carregar categorias');
        return json?.data?.categories as CategoryRow[] | undefined;
      })
      .then((rows) => {
        if (!active) return;
        const next = Array.isArray(rows) ? rows : [];
        setCategories(next);
        if (next[0]?.id) setCategoryId((prev) => prev || next[0].id);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : 'Erro ao carregar categorias';
        if (active) {
          setCategoriesError(msg);
          toast.error(msg);
        }
      })
      .finally(() => {
        if (active) setCategoriesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const categoryOptions = useMemo<FormOption[]>(
    () =>
      categories.map((c) => ({
        label: c.name || 'Sem nome',
        value: c.id,
      })),
    [categories]
  );

  const canSubmit = useMemo(() => {
    if (!title.trim() || title.trim().length < 3) return false;
    if (title.trim().length > 100) return false;
    const desc = description.trim();
    if (desc.length < 20 || desc.length > 500) return false;
    if (!categoryId) return false;

    const currentMediaCount = existingMedia.length + newImages.length;
    if (currentMediaCount < 1 || currentMediaCount > 5) return false;
    if (newImages.some((f) => !isAllowedImage(f))) return false;

    if (!isFree) {
      const p = toPriceNumber(price);
      if (!Number.isFinite(p) || p <= 0) return false;
    }
    return true;
  }, [categoryId, description, existingMedia.length, isFree, newImages, price, title]);

  const onNewFilesSelected = (files: File[]) => {
    // total max 5
    const allowed = 5 - existingMedia.length;
    setNewImages(files.slice(0, Math.max(0, allowed)));
  };

  const removeExisting = (id: string) => {
    setExistingMedia((prev) => {
      const item = prev.find((m) => m.id === id);
      if (item) setRemovedMedia((r) => [...r, item]);
      return prev.filter((m) => m.id !== id);
    });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (categoriesLoading) {
      const msg = 'Aguarde o carregamento das categorias.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (categories.length === 0) {
      const msg =
        categoriesError ||
        'Sem categorias disponíveis. Ative/crie categorias no Supabase (tabela categories com is_active=true) e garanta permissão de leitura (RLS).';
      setError(msg);
      toast.error(msg);
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();
    const priceNumber = isFree ? 0 : toPriceNumber(price);
    const quantityNumber = product.quantity;

    if (!canSubmit) {
      const msg = 'Verifique os campos do formulário.';
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      setLoading(true);

      const supabase = createClient();
      const bucket = 'product-media';

      // Best-effort delete removed files from storage (DB removal happens via API).
      const toRemovePaths = removedMedia
        .map((m) => (m.filename ? `${product.seller_id}/${product.id}/${m.filename}` : null))
        .filter((p): p is string => !!p);
      if (toRemovePaths.length > 0) {
        await supabase.storage.from(bucket).remove(toRemovePaths);
      }

      const mediaToAdd: Array<{
        url: string;
        filename: string;
        size_bytes: number;
        is_preview: boolean;
      }> = [];

      const remainingHasPreview = existingMedia.some((m) => m.is_preview);
      for (let i = 0; i < newImages.length; i++) {
        const file = newImages[i];
        if (!isAllowedImage(file)) throw new Error('Apenas imagens JPG/PNG até 5MB.');

        const path = `${product.seller_id}/${product.id}/${file.name}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
          cacheControl: '3600',
        });
        if (uploadError) {
          const msg = uploadError.message || 'Erro desconhecido';
          if (msg.toLowerCase().includes('row-level security')) {
            throw new Error(
              "Falha ao enviar imagem: permissão negada (RLS) no Storage. Crie/ajuste a policy do bucket `product-media` para permitir INSERT a utilizadores autenticados no caminho `{auth.uid()}/{product_id}/*`."
            );
          }
          throw new Error(`Falha ao enviar imagem: ${msg}`);
        }

        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
        const publicUrl = pub.publicUrl;
        if (!publicUrl) throw new Error('Falha ao obter URL pública da imagem');

        const shouldBePreview = !remainingHasPreview && i === 0 && existingMedia.length === 0;
        mediaToAdd.push({
          url: publicUrl,
          filename: file.name,
          size_bytes: file.size,
          is_preview: shouldBePreview,
        });
      }

      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          description: trimmedDesc,
          category_id: categoryId,
          condition,
          price: priceNumber,
          is_free: isFree,
          quantity: quantityNumber,
          media_remove_ids: removedMedia.map((m) => m.id),
          media_add: mediaToAdd,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json && (json.error || json.message)) || 'Erro ao atualizar produto');

      toast.success('Produto atualizado!');
      router.push('/profile');
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao atualizar produto';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Editar Produto</h1>
          <p className="text-sm text-gray-600 mt-1">Atualize as informações e imagens do seu produto.</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/profile')}
          className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50"
          disabled={loading}
        >
          Voltar
        </button>
      </div>

      {error && <FormAlert type="error" message={error} />}

      <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSelect
            label="Condição"
            name="condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value as ProductCondition)}
            options={CONDITION_OPTIONS}
            required
          />
          <FormSelect
            label="Categoria"
            name="category_id"
            value={categoryId}
            onChange={(e) => setCategoryId(String(e.target.value))}
            options={categoryOptions}
            required
            disabled={categoriesLoading || categoryOptions.length === 0}
          />
        </div>

        <FormInput
          label="Título"
          name="title"
          value={title}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
          required
          maxLength={100}
        />

        <FormTextarea
          label="Descrição"
          name="description"
          value={description}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
          rows={5}
          maxLength={500}
          required
          hint="Mínimo 20 caracteres."
        />

        <FormInput
          label="Preço (Kz)"
          name="price"
          type="number"
          value={price}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPrice(e.target.value)}
          min="1"
          step="100"
          required={!isFree}
          disabled={isFree}
        />

        <div className="mt-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">Imagens</div>
            <div className="text-xs text-gray-600">
              {existingMedia.length + newImages.length} / 5
            </div>
          </div>

          {existingMedia.length > 0 && (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-4">
              {existingMedia.map((m) => (
                <div key={m.id} className="relative group">
                  <img src={m.url || '/assets/placeholder-product.png'} alt="Imagem" className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                  {m.is_preview && (
                    <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-full bg-[#4B187C] text-white">
                      Capa
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeExisting(m.id)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                    aria-label="Remover imagem"
                    disabled={loading}
                  >
                    <span className="text-xl" aria-hidden="true">
                      ×
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {existingMedia.length < 5 && (
            <div className="mt-4">
              <FormFileUpload
                label="Adicionar novas imagens"
                onFilesSelected={onNewFilesSelected}
                maxFiles={Math.max(0, 5 - existingMedia.length)}
                acceptedTypes="image/jpeg,image/png"
                required={existingMedia.length === 0}
              />
              <p className="text-xs text-gray-500 mt-2">JPG/PNG até 5MB. Máximo 5 no total.</p>
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || !canSubmit}
            className={`px-6 py-3 rounded-xl text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
              loading || !canSubmit ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#4B187C] hover:bg-[#3E1367]'
            }`}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Salvando...
              </>
            ) : (
              'Salvar'
            )}
          </button>
        </div>
      </form>
        </div>
      </div>
  );
}
