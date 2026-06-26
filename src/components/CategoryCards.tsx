'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Category {
  id: string;
  name: string;
  slug: string;
}

const CATEGORY_IMAGES: Record<string, string> = {
  bagagem: '/assets/categories/bagagem.png',
  comida: '/assets/categories/comida.png',
  decorativo: '/assets/categories/decorativo.png',
  desporto: '/assets/categories/desporto.png',
  'escolar-escritorio': '/assets/categories/escolarescritorio.png',
  'joalharia-relogios': '/assets/categories/joalhariarelogios.png',
  'lazer-hobbies': '/assets/categories/lazerhobbies.png',
  livros: '/assets/categories/livros.png',
  pet: '/assets/categories/pet.png',
  'roupas-calcados': '/assets/categories/roupascalcados.png',
  servicos: '/assets/categories/servicos.png',
  tecnologia: '/assets/categories/tecnologia.png',
  'saude-beleza': '/assets/categories/belezasaude.png',
};

export default function CategoryCards() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  const total = categories.length;
  // On desktop (3 cols): how many cards in the last row
  const remainder3 = total % 3; // 0=full, 1=one alone, 2=two
  // On mobile (2 cols): how many in last row
  const remainder2 = total % 2;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {categories.map((cat, index) => {
        const isLast = index === total - 1;
        const isSecondToLast = index === total - 2;

        // Desktop: if last row has only 1 card, make it span 3
        const desktopSpan =
          isLast && remainder3 === 1
            ? 'md:col-span-3'
            : isLast && remainder3 === 2
            ? 'md:col-span-1'
            : isSecondToLast && remainder3 === 2
            ? 'md:col-span-1'
            : 'md:col-span-1';

        // Mobile: if last row has only 1 card, make it span 2
        const mobileSpan =
          isLast && remainder2 === 1 ? 'col-span-2' : 'col-span-1';

        const img = CATEGORY_IMAGES[cat.slug];

        return (
          <Link
            key={cat.id}
            href={`/categoria/${cat.slug}`}
            className={`relative overflow-hidden cursor-pointer group h-44 md:h-100 block rounded-xl ${mobileSpan} ${desktopSpan}`}
          >
            {img ? (
              <img
                src={img}
                alt={cat.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-[#EDE7FF] transition-transform duration-300 group-hover:scale-105" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <span className="bg-white text-gray-900 font-semibold text-sm px-5 py-2 rounded-full shadow-md group-hover:bg-[#EDE7FF] group-hover:text-[#4B187C] transition-colors whitespace-nowrap">
                {cat.name}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
