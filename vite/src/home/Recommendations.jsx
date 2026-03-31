import React from 'react';
import Header from '../components/layout/Header';
import ProductGrid from '../components/produtos/ProductGrid';

const sampleProducts = [
  {
    id: 1,
    title: 'Calculo Volume 1',
    category: 'Material de Estudos',
    price: '5.000',
    seller: 'Maria Candido',
    img: 'https://via.placeholder.com/250x200?text=Calculo+1',
    statusColor: 'bg-red-400',
  },
  {
    id: 2,
    title: 'Iphone 8',
    category: 'Tecnologia',
    price: '35.000',
    seller: 'Paulo Combo',
    img: 'https://via.placeholder.com/250x200?text=iPhone+8',
    statusColor: 'bg-green-400',
  },
  {
    id: 3,
    title: 'Calculo Volume 1',
    category: 'Livros',
    price: '5.000',
    seller: 'Maria Candido',
    img: 'https://via.placeholder.com/250x200?text=Livro+1',
    statusColor: 'bg-red-400',
  },
  {
    id: 4,
    title: 'Calculo Volume 1',
    category: 'Livros',
    price: '5.000',
    seller: 'Maria Candido',
    img: 'https://via.placeholder.com/250x200?text=Livro+2',
    statusColor: 'bg-red-400',
  },
];

const Recommendations = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-10">
        {[1, 2].map((section) => (
          <section key={section} className={section === 1 ? '' : 'mt-12'}>
            <h2 className="text-xl md:text-2xl font-semibold mb-6 text-gray-900">
              Lorem Ipsum Dolor!
            </h2>
            <ProductGrid products={sampleProducts} />
          </section>
        ))}
      </main>
    </div>
  );
};

export default Recommendations;

