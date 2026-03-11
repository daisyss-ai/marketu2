import React from 'react'

const Funciona = () => {
    const categories = [
    {
      title: 'Cria a tua conta',
      description: 'Registo rápido com o teu ID estudantil',
      bgColor: 'bg-[#b8e5cd]',
      textColor: 'text-gray-800',
    },
    {
      title: 'Explora ou publica',
      description: 'Encontra itens ou vende o que já não usas',
      bgColor: 'bg-[#ffad87]',
      textColor: 'text-gray-800',
    },
    {
      title: 'Negocia em Segurança',
      description: 'Chat integrado, perfis verificados e avaliações',
      bgColor: 'bg-[#6d28d9]',
      textColor: 'text-white',
    },
    {
      title: 'Conclui o Negócio',
      description: 'Encontro no Campus ou entrega segura',
      bgColor: 'bg-[#f0f0f0]',
      textColor: 'text-gray-800',
    },
  ];

  return (
    <div>

    <section className="bg-gray-100 py-16 px-4 md:px-10 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Como Funciona
            </h2>
            <p className="text-gray-600">
             Navega por milhares de items em todas categorias que precisas para a vida estudantil
            </p>
          </div>
          <button className="mt-4 md:mt-0 bg-[#ffad87] hover:bg-[#ffad87] text-white px-6 py-2 rounded-md text-sm transition-colors">
            Ver todas
          </button>
        </div>

        {/* Cards Row (Horizontal Scroll) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat, index) => (
            <div
              key={index}
              className={`${cat.bgColor} ${cat.textColor} aspect-[4/5] rounded-xl p-6 flex flex-col justify-center items-center text-center shadow-sm hover:scale-105 cursor-pointer transition-transform duration-200`}
            >
              <h3 className="font-bold text-lg leading-tight mb-2">
                {cat.title}
              </h3>
              <p className="text-sm opacity-90 leading-relaxed">
                {cat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>

    </div>
  )
}

export default Funciona