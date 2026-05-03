'use client';

import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormAlert, FormFileUpload, FormInput, FormSelect, FormTextarea, LoadingSpinner } from '@/components/FormFields';
import type { FormOption } from '@/types';

type ProductType = 'physical_product' | 'digital_material' | 'service';

const CATEGORY_OPTIONS: FormOption[] = [
  { label: 'Material Escolar', value: 'material_escolar' },
  { label: 'Tecnologia', value: 'tecnologia' },
  { label: 'Livros', value: 'livros' },
  { label: 'Roupas e Acessórios', value: 'roupas' },
  { label: 'Serviços', value: 'servicos' },
  { label: 'Outros', value: 'outros' },
] as const satisfies FormOption[];

const TYPE_OPTIONS: FormOption[] = [
  { label: 'Produto físico', value: 'physical_product' },
  { label: 'Serviço', value: 'service' },
  { label: 'Material digital', value: 'digital_material' },
];

function toPriceNumber(v: string) {
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('material_escolar');
  const [type, setType] = useState<ProductType>('physical_product');
  const [price, setPrice] = useState('0');
  const [images, setImages] = useState<File[]>([]);

  const canSubmit = useMemo(() => {
    if (!title.trim()) return false;
    const p = toPriceNumber(price);
    if (!Number.isFinite(p) || p < 0) return false;
    if (images.length < 1) return false;
    return true;
  }, [images.length, price, title]);

  const onFilesSelected = (files: File[]) => {
    setImages(files.slice(0, 5));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!canSubmit) {
      setError('Preencha o título, preço válido e pelo menos 1 imagem.');
      return;
    }

    const priceNumber = toPriceNumber(price);
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      setError('Preço inválido.');
      return;
    }

    const fd = new FormData();
    fd.set('title', title.trim());
    fd.set('description', description.trim());
    fd.set('category', category);
    fd.set('type', type);
    fd.set('price', String(priceNumber));
    images.forEach((f) => fd.append('images', f, f.name));

    try {
      setLoading(true);
      const res = await fetch('/api/products', { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (json && (json.error || json.message)) || 'Erro ao publicar produto';
        throw new Error(msg);
      }

      setSuccess('Produto publicado com sucesso! Redirecionando…');
      setTimeout(() => router.push('/dashboard'), 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao publicar produto';
      setError(msg);
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
        {success && <FormAlert type="success" message={success} />}

        <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              label="Tipo"
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value as ProductType)}
              options={TYPE_OPTIONS}
              required
            />
            <FormSelect
              label="Categoria"
              name="category"
              value={category}
              onChange={(e) => setCategory(String(e.target.value))}
              options={CATEGORY_OPTIONS}
              required
            />
          </div>

          <FormInput
            label="Título"
            name="title"
            value={title}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            placeholder="Ex: Calculadora científica Casio"
            required
            maxLength={100}
          />

          <FormTextarea
            label="Descrição"
            name="description"
            value={description}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            placeholder="Detalhes do produto, estado, observações…"
            rows={5}
            maxLength={800}
            hint="Opcional, mas ajuda a vender mais rápido."
          />

          <FormInput
            label="Preço (Kz)"
            name="price"
            type="number"
            value={price}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPrice(e.target.value)}
            min="0"
            step="100"
            required
          />

          <div className="mt-2">
            <FormFileUpload
              label="Imagens"
              onFilesSelected={onFilesSelected}
              maxFiles={5}
              acceptedTypes="image/*"
              required
            />
            <p className="text-xs text-gray-500 mt-2">Máximo 5 imagens (a primeira vira capa).</p>
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
