import React from 'react';
import Header from '../components/layout/Header';
import { Laptop, ShoppingBag, BookOpenCheck, Shirt } from 'lucide-react';

const categories = [
  { name: 'Material Escolar', items: 40, icon: BookOpenCheck, accent: 'from-amber-100 to-orange-50' },
  { name: 'Tecnologia', items: 40, icon: Laptop, accent: 'from-sky-100 to-indigo-50' },
  { name: 'Serviços', items: 40, icon: ShoppingBag, accent: 'from-emerald-100 to-teal-50' },
  { name: 'Roupas e Acessorios', items: 40, icon: Shirt, accent: 'from-pink-100 to-rose-50' },
  { name: 'Material Escolar', items: 40, icon: BookOpenCheck, accent: 'from-amber-100 to-orange-50' },
  { name: 'Material Escolar', items: 40, icon: BookOpenCheck, accent: 'from-amber-100 to-orange-50' },
];

const CategoriesPage = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
          Categorias Populares
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Explore rapidamente as categorias mais procuradas pelos estudantes.
        </p>
        <div className="border-b border-gray-200 mb-8" />

        <div className="grid md:grid-cols-2 gap-5">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={`${cat.name}-${idx}`}
                className="relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-r from-gray-100 via-white to-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
              >
                <div className="bg-white rounded-2xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-16 h-16 rounded-xl bg-gradient-to-br ${cat.accent} flex items-center justify-center`}
                    >
                      <Icon className="w-7 h-7 text-[#4B187C]" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{cat.name}</div>
                      <div className="text-sm text-gray-500">
                        {cat.items} itens disponíveis
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:block w-28 h-20 rounded-xl bg-gray-100 bg-gradient-to-tr from-white to-gray-100" />
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default CategoriesPage;

