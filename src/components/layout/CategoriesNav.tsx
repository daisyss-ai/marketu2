'use client';

interface CategoriesNavProps {
  onCategoryClick?: (slug: string) => void;
}

export default function CategoriesNav({ onCategoryClick }: CategoriesNavProps) {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-8 py-4 overflow-x-auto scrollbar-hide">
          <a 
            href="#" 
            className="text-base font-semibold text-gray-900 hover:text-[#4B187C] transition-colors whitespace-nowrap"
          >
            Explorar
          </a>
          <button 
            onClick={() => onCategoryClick?.('material_escolar')}
            className="text-base font-medium text-gray-600 hover:text-[#4B187C] transition-colors whitespace-nowrap"
          >
            Material Escolar
          </button>
          <button 
            onClick={() => onCategoryClick?.('tecnologia')}
            className="text-base font-medium text-gray-600 hover:text-[#4B187C] transition-colors whitespace-nowrap"
          >
            Tecnologia
          </button>
          <button 
            onClick={() => onCategoryClick?.('livros')}
            className="text-base font-medium text-gray-600 hover:text-[#4B187C] transition-colors whitespace-nowrap"
          >
            Livros
          </button>
          <button 
            onClick={() => onCategoryClick?.('roupas')}
            className="text-base font-medium text-gray-600 hover:text-[#4B187C] transition-colors whitespace-nowrap"
          >
            Roupas e Acessórios
          </button>
          <button 
            onClick={() => onCategoryClick?.('servicos')}
            className="text-base font-medium text-gray-600 hover:text-[#4B187C] transition-colors whitespace-nowrap"
          >
            Serviços
          </button>
          <button 
            onClick={() => onCategoryClick?.('outros')}
            className="text-base font-medium text-gray-600 hover:text-[#4B187C] transition-colors whitespace-nowrap"
          >
            Outros
          </button>
        </div>
      </div>
    </nav>
  );
}
