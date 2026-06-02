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

function toPriceNumber(v: string) {
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

function isAllowedImage(file: File) {
  const allowed = file.type === 'image/jpeg' || file.type === 'image/png';
  const maxBytes = 5 * 1024 * 1024;
  return allowed && file.size <= maxBytes;
}

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [condition, setCondition] = useState<ProductCondition>('new');
  const [price, setPrice] = useState('0');
  const [isFree, setIsFree] = useState(false);
  const [images, setImages] = useState<File[]>([]);

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
    if (!title.trim()) return false;
    if (title.trim().length > 100) return false;
    const desc = description.trim();
    if (desc.length < 20 || desc.length > 500) return false;
    if (!categoryId) return false;
    if (images.length < 1) return false;
    if (images.some((f) => !isAllowedImage(f))) return false;
    if (!isFree) {
      const p = toPriceNumber(price);
      if (!Number.isFinite(p) || p < 0) return false;
    }
    return true;
  }, [categoryId, description, images, isFree, price, title]);

  const onFilesSelected = (files: File[]) => {
    setImages(files.slice(0, 5));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    if (!trimmedTitle) {
      const msg = 'O tÃ­tulo Ã© obrigatÃ³rio.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (trimmedTitle.length > 100) {
      const msg = 'O tÃ­tulo deve ter no mÃ¡ximo 100 caracteres.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (trimmedDesc.length < 20 || trimmedDesc.length > 500) {
      const msg = 'A descriÃ§Ã£o deve ter entre 20 e 500 caracteres.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!categoryId) {
      const msg = 'Selecione uma categoria.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (categoriesLoading) {
      const msg = 'Aguarde o carregamento das categorias.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (categories.length === 0) {
      const msg =
        categoriesError ||
        'Sem categorias disponÃ­veis. Ative/crie categorias no Supabase (tabela categories com is_active=true) e garanta permissÃ£o de leitura (RLS).';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (images.length < 1) {
      const msg = 'Envie pelo menos 1 imagem.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (images.length > 5) {
      const msg = 'MÃ¡ximo 5 imagens.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (images.some((f) => !isAllowedImage(f))) {
      const msg = 'Apenas imagens JPG/PNG atÃ© 5MB.';
      setError(msg);
      toast.error(msg);
      return;
    }

    const priceNumber = isFree ? 0 : toPriceNumber(price);
    if (!isFree && (!Number.isFinite(priceNumber) || priceNumber < 0)) {
      const msg = 'PreÃ§o invÃ¡lido.';
      setError(msg);
      toast.error(msg);
      return;
    }

    let createdProductId: string | null = null;
    try {
      setLoading(true);

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          description: trimmedDesc,
          category_id: categoryId,
          condition,
          price: priceNumber,
          is_free: isFree,
          quantity: 1,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json && (json.error || json.message)) || 'Erro ao criar produto');

      const productId = String(json?.data?.id || '');
      const sellerId = String(json?.data?.seller_id || '');
      if (!productId || !sellerId) throw new Error('Resposta invÃ¡lida do servidor');
      createdProductId = productId;

      const supabase = createClient();
      const bucket = 'product-media';

      const mediaToAdd: Array<{
        url: string;
        filename: string;
        size_bytes: number;
        position: number;
        is_preview: boolean;
      }> = [];
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const path = `${sellerId}/${productId}/${file.name}`;

        const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
          cacheControl: '3600',
        });
        if (uploadError) {
          const msg = uploadError.message || 'Erro desconhecido';
          if (msg.toLowerCase().includes('row-level security')) {
            throw new Error(
              "Falha ao enviar imagem: permissÃ£o negada (RLS) no Storage. Crie/ajuste a policy do bucket `product-media` para permitir INSERT a utilizadores autenticados no caminho `{auth.uid()}/{product_id}/*`."
            );
          }
          throw new Error(`Falha ao enviar imagem: ${msg}`);
        }

        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
        const publicUrl = pub.publicUrl;
        if (!publicUrl) throw new Error('Falha ao obter URL pÃºblica da imagem');

        mediaToAdd.push({
          url: publicUrl,
          filename: file.name,
          size_bytes: file.size,
          position: i,
          is_preview: i === 0,
        });
      }

      const patchRes = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ media_add: mediaToAdd }),
      });
      const patchJson = await patchRes.json().catch(() => ({}));
      if (!patchRes.ok) throw new Error((patchJson && (patchJson.error || patchJson.message)) || 'Erro ao salvar imagens');

      toast.success('Produto publicado com sucesso!');
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao publicar produto';
      setError(msg);
      toast.error(msg);

      if (createdProductId) {
        try {
          await fetch(`/api/products/${createdProductId}`, { method: 'DELETE' });
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-6 pt-10 pb-16">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Novo Produto</h1>
            <p className="text-sm text-gray-600 mt-1">Publique um produto para aparecer no marketplace.</p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
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
              label="CondiÃ§Ã£o"
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
            label="TÃ­tulo"
            name="title"
            value={title}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            placeholder="Ex: Calculadora cientÃ­fica Casio"
            required
            maxLength={100}
          />

          <FormTextarea
            label="DescriÃ§Ã£o"
            name="description"
            value={description}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            placeholder="Detalhes do produto, estado, observaÃ§Ãµesâ€¦"
            rows={5}
            maxLength={500}
            required
            hint="MÃ­nimo 20 caracteres."
          />

          <div className="flex items-center justify-between gap-4">
            <FormInput
              label="PreÃ§o (Kz)"
              name="price"
              type="number"
              value={price}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPrice(e.target.value)}
              min="0"
              step="100"
              required={!isFree}
              disabled={isFree}
            />

            <label className="flex items-center gap-3 mt-6 select-none">
              <input
                type="checkbox"
                className="h-5 w-5 accent-[#4B187C]"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
                disabled={loading}
              />
              <span className="text-sm font-semibold text-gray-900">Gratuito</span>
            </label>
          </div>

          <div className="mt-2">
            <FormFileUpload
              label="Imagens"
              onFilesSelected={onFilesSelected}
              maxFiles={5}
              acceptedTypes="image/jpeg,image/png"
              required
            />
            <p className="text-xs text-gray-500 mt-2">MÃ¡ximo 5 imagens (a primeira vira capa). JPG/PNG atÃ© 5MB.</p>
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
                  Publicando...
                </>
              ) : (
                'Publicar'
              )}
            </button>
            <span className="text-xs text-gray-500">
              {images.length ? `${images.length} arquivo(s) selecionado(s)` : 'Selecione pelo menos 1 imagem'}
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
