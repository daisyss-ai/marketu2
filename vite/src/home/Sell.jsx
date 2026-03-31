import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Upload } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuthStore } from '../store/authStore';
import {
  FormInput,
  FormTextarea,
  FormSelect,
  FormFileUpload,
  FormAlert,
  LoadingSpinner,
} from '../components/FormFields';
import { useProductUpload, useImageUpload } from '../hooks/useAPI';

const Sell = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const { uploadProduct, loading, error, success } = useProductUpload();
  const { uploadImages } = useImageUpload();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: '',
    price: '',
    location: '',
    image_urls: [],
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  const categories = [
    { value: 'Material Escolar', label: 'Material Escolar' },
    { value: 'Tecnologia', label: 'Tecnologia' },
    { value: 'Livros', label: 'Livros' },
    { value: 'Roupas e Acessórios', label: 'Roupas e Acessórios' },
    { value: 'Eletrônicos', label: 'Eletrônicos' },
    { value: 'Móveis', label: 'Móveis' },
    { value: 'Esportes', label: 'Esportes' },
    { value: 'Outros', label: 'Outros' },
  ];

  const conditions = [
    { value: 'novo', label: 'Novo' },
    { value: 'como_novo', label: 'Como Novo' },
    { value: 'usado', label: 'Usado' },
  ];

  const locations = [
    { value: 'Luanda', label: 'Luanda' },
    { value: 'Huambo', label: 'Huambo' },
    { value: 'Benguela', label: 'Benguela' },
    { value: 'Cabinda', label: 'Cabinda' },
    { value: 'Online', label: 'Online' },
  ];

  if (!authUser) {
    return (
      <div>
        <Header />
        <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow text-center">
          <p className="text-gray-600 mb-4">Você precisa estar autenticado para publicar um produto.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-[#4B187C] text-white px-4 py-2 rounded hover:bg-[#3E1367]"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleFilesSelected = async (files) => {
    setUploadedFiles(files);
    // For now, create URLs for preview
    const urls = files.map((file) => URL.createObjectURL(file));
    setFormData((prev) => ({
      ...prev,
      image_urls: urls,
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Título é obrigatório';
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

    if (!formData.category) {
      errors.category = 'Categoria é obrigatória';
    }

    if (!formData.condition) {
      errors.condition = 'Condição é obrigatória';
    }

    if (!formData.price) {
      errors.price = 'Preço é obrigatório';
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      errors.price = 'Preço deve ser um número positivo';
    }

    if (!formData.location) {
      errors.location = 'Localização é obrigatória';
    }

    if (formData.image_urls.length === 0) {
      errors.images = 'Pelo menos uma imagem é obrigatória';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setValidationErrors({});

      // Prepare product data
      const productData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        condition: formData.condition,
        price: parseFloat(formData.price),
        location: formData.location,
        image_urls: formData.image_urls,
        stock: 1, // Default stock quantity
      };

      // Upload product
      await uploadProduct(productData);

      // Show success message
      setSuccessMessage('✅ Produto publicado com sucesso! Redirecionando para a home...');

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        condition: '',
        price: '',
        location: '',
        image_urls: [],
      });
      setUploadedFiles([]);

      // Redirect to home after 2 seconds to see the product
      setTimeout(() => {
        navigate('/home');
      }, 2000);
    } catch (err) {
      console.error('Error uploading product:', err);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 text-[#4B187C] hover:text-[#3E1367] font-medium mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar ao Perfil
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Publicar Produto</h1>
          <p className="text-gray-600 mt-2">Preencha os detalhes do seu produto e publique para venda</p>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        {error && <FormAlert type="error" message={error} />}
        {successMessage && (
          <FormAlert
            type="success"
            message={successMessage}
            onClose={() => setSuccessMessage('')}
          />
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Images Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Imagens do Produto</h2>
            <FormFileUpload
              label="Fotos do Produto"
              onFilesSelected={handleFilesSelected}
              error={validationErrors.images}
              maxFiles={5}
              acceptedTypes="image/*"
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              Máximo 5 imagens. Use alta qualidade para melhor visualização.
            </p>
          </div>

          {/* Product Information Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Informações do Produto</h2>

            <FormInput
              label="Título do Produto"
              name="title"
              placeholder="Ex: Livro de Cálculo - 1ª Edição"
              value={formData.title}
              onChange={handleInputChange}
              error={validationErrors.title}
              required
              maxLength={100}
            />

            <FormTextarea
              label="Descrição Detalhada"
              name="description"
              placeholder="Descreva seu produto em detalhes: estado, características, motivo da venda, defeitos (se houver), etc."
              value={formData.description}
              onChange={handleInputChange}
              error={validationErrors.description}
              required
              maxLength={500}
              rows={5}
              hint="Mínimo 20 caracteres, máximo 500"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelect
                label="Categoria"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                options={categories}
                error={validationErrors.category}
                required
                placeholder="Selecione uma categoria"
              />

              <FormSelect
                label="Condição"
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                options={conditions}
                error={validationErrors.condition}
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
                error={validationErrors.price}
                required
                min="0"
                step="100"
              />

              <FormSelect
                label="Localização"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                options={locations}
                error={validationErrors.location}
                required
                placeholder="Selecione a localização"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/profile')}
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

          {/* Form Tips */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">💡 Dicas para vender mais rápido:</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>✓ Use um título claro e descritivo</li>
              <li>✓ Adicione fotos de alta qualidade do produto</li>
              <li>✓ Descreva o estado real do produto</li>
              <li>✓ Defina um preço competitivo</li>
              <li>✓ Responda rapidamente às mensagens
</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Sell;
