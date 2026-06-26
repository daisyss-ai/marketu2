'use client';
import { useRouter } from 'next/navigation';
import { startTransition, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { ChevronLeft, Upload } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuthStore } from '../store/authStore';
import { FormInput, FormTextarea, FormSelect, FormFileUpload, FormAlert, LoadingSpinner } from '../components/FormFields';
import { useProductUpload } from '../hooks/useAPI';

interface SellFormData {
  title: string;
  description: string;
  category_id: string;
  condition: 'new' | 'used' | 'digital' | '';
  price: string;
  image_urls: string[];
}

interface ValidationErrors {
  [key: string]: string | null | undefined;
}

const Sell = () => {
  const router = useRouter();
  const authUser = useAuthStore((state) => state.user);
  const { uploadProduct, loading, error } = useProductUpload();

  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<Array<{ value: string; label: string }>>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SellFormData>({
    title: '',
    description: '',
    category_id: '',
    condition: '',
    price: '',
    image_urls: [],
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [successMessage, setSuccessMessage] = useState('');

  

  useEffect(() => {
    let active = true;
    startTransition(() => setCategoriesLoading(true));
    startTransition(() => setCategoriesError(null));
    fetch('/api/categories', { method: 'GET' })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((json && (json.error || json.message)) || 'Erro ao carregar categorias');
        return json?.data?.categories as Array<{ id: string; name: string | null }> | undefined;
      })
      .then((rows) => {
        if (!active) return;
        const next = (Array.isArray(rows) ? rows : []).map((c) => ({ value: c.id, label: c.name || 'Sem nome' }));
        setCategories(next);
        if (next[0]?.value) {
          setFormData((prev) => ({ ...prev, category_id: prev.category_id || next[0].value }));
        }
      })
      .catch((e: unknown) => {
        if (!active) return;
        const msg = e instanceof Error ? e.message : 'Erro ao carregar categorias';
        setCategoriesError(msg);
      })
      .finally(() => {
        if (active) setCategoriesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

  const conditions = useMemo(
    () => [
      { value: 'new', label: 'Novo' },
      { value: 'used', label: 'Usado' },
      { value: 'digital', label: 'Digital' },
    ],
    []
  );

  if (!mounted) {
    return (
      <div>
        <Header />
        <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow text-center">
          <p className="text-gray-600 mb-4">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div>
        <Header />
        <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow text-center">
          <p className="text-gray-600 mb-4">Você precisa estar autenticado para publicar um produto.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-[#4B187C] text-white px-4 py-2 rounded hover:bg-[#3E1367]"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleFilesSelected = async (files: File[]) => {
    const limited = files.slice(0, 5);
    setUploadedFiles(limited);
    const urls = limited.map((file) => URL.createObjectURL(file));
    setFormData((prev) => ({
      ...prev,
      image_urls: urls,
    }));
  };

  const validateForm = () => {
    const errors: ValidationErrors = {};

    if (!formData.title.trim()) {
      errors.title = 'Título é obrigatório';
    } else if (formData.title.trim().length < 3) {
      errors.title = 'Título deve ter pelo menos 3 caracteres';
    } else if (formData.title.length > 100) {
      errors.title = 'Título não pode exceder 100 caracteres';
    }

    if (!formData.description.trim()) {
      errors.description = 'Descrição é obrigatória';
    } else if (formData.description.length < 20) {
      errors.description = 'Descrição deve ter pelo menos 20 caracteres';
    } else if (formData.description.length > 500) {
      errors.description = 'Descrição não pode exceder 500 caracteres';
    }

    if (!formData.category_id) {
      errors.category_id = 'Categoria é obrigatória';
    }

    if (!formData.condition) {
      errors.condition = 'Condição é obrigatória';
    }

    if (!formData.price) {
      errors.price = 'Preço é obrigatório';
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      errors.price = 'Preço deve ser maior que 0 Kz';
    }

    if (formData.image_urls.length === 0) {
      errors.images = 'Pelo menos uma imagem é obrigatória';
    }

    return errors;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (categoriesLoading) {
      setValidationErrors({ submit: 'Aguarde o carregamento das categorias.' });
      return;
    }
    if (categories.length === 0) {
      setValidationErrors({
        submit:
          categoriesError ||
          'Sem categorias disponíveis. Ative/crie categorias no Supabase (tabela categories com is_active=true) e garanta permissão de leitura (RLS).',
      });
      return;
    }

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setValidationErrors({});

      await uploadProduct({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category_id: formData.category_id,
        condition: (formData.condition || 'used') as 'new' | 'used' | 'digital',
        price: parseFloat(formData.price),
        is_free: false,
        quantity: 1,
        files: uploadedFiles,
      });

      setSuccessMessage('✅ Produto publicado com sucesso! Redirecionando para a home...');

      setFormData({
        title: '',
        description: '',
        category_id: '',
        condition: '',
        price: '',
        image_urls: [],
      });
      setUploadedFiles([]);

      setTimeout(() => {
        router.push('/home');
      }, 2000);
    } catch (err) {
      console.error('Error uploading product:', err);
      const errorMsg =
        err instanceof Error ? err.message : (err as { error?: string } | null)?.error || 'Erro desconhecido ao publicar produto';
      setValidationErrors({ submit: errorMsg });
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center gap-2 text-[#4B187C] hover:text-[#3E1367] font-medium mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar ao Perfil
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Publicar Produto</h1>
          <p className="text-gray-600 mt-2">Preencha os detalhes do seu produto e publique para venda</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {error && <FormAlert type="error" message={error} />}
        {successMessage && <FormAlert type="success" message={successMessage} />}
        {validationErrors.submit && <FormAlert type="error" message={validationErrors.submit} />}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Fotos do Produto</h2>
            <FormFileUpload
              label="Imagens"
              onFilesSelected={handleFilesSelected}
              maxFiles={5}
              acceptedTypes="image/*"
              error={validationErrors.images || undefined}
              required
            />
            <p className="text-xs text-gray-500 mt-2">Máximo 5 imagens. Use alta qualidade para melhor visualização.</p>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Informações do Produto</h2>

            <FormInput
              label="Título do Produto"
              name="title"
              placeholder="Ex: Livro de Cálculo - 1ª Edição"
              value={formData.title}
              onChange={handleInputChange}
              error={validationErrors.title || undefined}
              required
              maxLength={100}
            />

            <FormTextarea
              label="Descrição Detalhada"
              name="description"
              placeholder="Descreva seu produto em detalhes: estado, características, motivo da venda, defeitos (se houver), etc."
              value={formData.description}
              onChange={handleInputChange}
              error={validationErrors.description || undefined}
              required
              maxLength={500}
              rows={5}
              hint="Mínimo 20 caracteres, máximo 500"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelect
                label="Categoria"
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                options={categories}
                error={validationErrors.category_id || undefined}
                required
                placeholder="Selecione uma categoria"
                disabled={categoriesLoading || categories.length === 0}
              />

              <FormSelect
                label="Condição"
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                options={conditions}
                error={validationErrors.condition || undefined}
                required
                placeholder="Selecione a condição"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Preço (em Kz)"
                name="price"
                type="number"
                placeholder="Ex: 5000"
                value={formData.price}
                onChange={handleInputChange}
                error={validationErrors.price || undefined}
                required
                min="1"
                step="100"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/profile')}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#4B187C] to-[#6a0dad] hover:from-[#3E1367] hover:to-[#5a0a9d]'
              }`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Publicando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Publicar Produto
                </>
              )}
            </button>
          </div>
        </form>

        {categoriesError && (
          <div className="mt-4">
            <FormAlert type="error" message={`Categorias: ${categoriesError}`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Sell;

