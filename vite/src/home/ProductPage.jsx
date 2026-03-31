import React, { useState } from 'react';
import Header from '../components/layout/Header';
import { Heart, Star } from 'lucide-react';

const ProductPage = () => {
  const colors = ['#F9C7C4', '#F2F2F2', '#E0F5D0', '#D6E4F5', '#B0BEC5'];
  const galleryImages = [
    'https://via.placeholder.com/640x480?text=Imagem+1',
    'https://via.placeholder.com/640x480?text=Imagem+2',
    'https://via.placeholder.com/640x480?text=Imagem+3',
    'https://via.placeholder.com/640x480?text=Imagem+4',
  ];
  const [activeImage, setActiveImage] = useState(galleryImages[0]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* breadcrumb */}
        <div className="text-xs text-gray-500 mb-4">
          Categoria / Subcategoria /{' '}
          <span className="text-gray-700 font-medium">Nome do Produto</span>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          {/* left: gallery */}
          <div>
            <div className="bg-white rounded-2xl p-4 shadow-md flex items-center justify-center overflow-hidden group">
              <img
                src={activeImage}
                alt="Produto"
                className="w-full h-auto object-contain rounded-xl group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            <div className="mt-4 grid grid-cols-4 gap-3">
              {galleryImages.map((src) => {
                const isActive = src === activeImage;
                return (
                  <button
                    type="button"
                    key={src}
                    onClick={() => setActiveImage(src)}
                    className={`h-20 rounded-xl border-2 bg-white overflow-hidden hover:border-[#4B187C] transition-colors ${
                      isActive ? 'border-[#4B187C]' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={src}
                      alt="Miniatura"
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* right: details */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center rounded-full bg-purple-100 text-[#4B187C] px-3 py-1 text-xs font-semibold uppercase">
                Material de Estudos
              </span>
              <button
                aria-label="Favoritar"
                className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-300 transition-colors"
              >
                <Heart className="w-5 h-5" />
              </button>
            </div>

            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <div className="text-3xl font-extrabold text-[#4B187C]">500 Kz</div>
                <div className="text-xs text-gray-400 line-through">650 Kz</div>
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">Calculo Volume 1</h1>

              <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-0.5 text-yellow-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                </div>
                <span className="font-medium text-gray-800">4.8</span>
                <span>(121 avaliações)</span>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              Livro de Calculo 1 de James Stewart em excelente estado de conservação, quase sem uso,
              apenas algumas anotações a lápis nas primeiras páginas que podem ser apagadas. Ideal
              para estudantes de Engenharia, Matemática e Ciências Exatas.
            </p>

            {/* colors */}
            <div>
              <div className="text-sm font-medium text-gray-900 mb-2">Escolha um tipo</div>
              <div className="flex items-center gap-3">
                {colors.map((c, idx) => (
                  <button
                    key={c}
                    className={`w-8 h-8 rounded-full border-2 ${
                      idx === 0 ? 'border-[#4B187C]' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-600">
                Apenas <span className="text-orange-500 font-semibold">3 itens</span> em stock — não
                perca esta oportunidade.
              </p>
            </div>

            {/* meta cards */}
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-2 shadow-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Categoria</span>
                  <span className="font-medium text-gray-900">Material de Estudos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Condição</span>
                  <span className="font-medium text-gray-900">Novo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Publicado</span>
                  <span className="font-medium text-gray-900">Há 2 dias</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100 flex flex-col justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-200" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Stephane Quinana</div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span>4.8 (121)</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500">Membro desde 2025</div>
              </div>
            </div>

            <button className="w-full mt-2 bg-[#4B187C] hover:bg-[#3E1367] text-white py-3 rounded-full text-sm font-semibold shadow-md transition-colors">
              Contatar Vendedor
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductPage;

