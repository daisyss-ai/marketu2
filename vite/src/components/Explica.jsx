import React from 'react'
import { Users, Zap, Smartphone } from 'lucide-react'; 
const Explica = () => {
    const features = [
  {
    title: 'Comunidade 100%',
    description: 'Compra e vende exclusivamente com estudantes verificados do instituto. Ambiente seguro e pessoas que entendem as tuas necessidades.',
    icon: <Users className="w-8 h-8 text-gray-400" />,
  },
  {
    title: 'Rápido & Confiável',
    description: 'Negocia diretamente com vendedores da tua escola. Entrega rápida, encontros na escola e em locais públicos. Avalie cada transação.',
    icon: <Zap className="w-8 h-8 text-gray-400" />,
  },
  {
    title: 'Mobile & Fácil',
    description: 'App instintiva, liste itens em segundos. Chat instantâneo. Feche o seu negócio em minutos. Simples assim!',
    icon: <Smartphone className="w-8 h-8 text-gray-400" />,
  },
];
  return (
    <div>

    <section className="bg-gray-200 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Porquê o Marketu?
        </h2>

        <div className="space-y-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-3xl p-8 flex items-start gap-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="bg-gray-200/50 p-4 rounded-xl flex-shrink-0">
                {feature.icon}
              </div>

              <div className="flex flex-col">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}

        </div>
      </div>
    </section>

    </div>
  )
}

export default Explica