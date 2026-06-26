'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoriesNavProps {
  onCategoryClick?: (slug: string) => void;
}

export default function CategoriesNav({ onCategoryClick }: CategoriesNavProps) {
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

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-8 py-4 overflow-x-auto scrollbar-hide">
          <Link
            href="/home"
            className="text-base font-semibold text-gray-900 hover:text-[#4B187C] transition-colors whitespace-nowrap"
          >
            Explorar
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categoria/${cat.slug}`}
              onClick={() => onCategoryClick?.(cat.slug)}
              className="text-base font-medium text-gray-600 hover:text-[#4B187C] transition-colors whitespace-nowrap"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}