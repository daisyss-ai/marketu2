import { Box, DollarSign, Receipt, ThumbsUp, Users,Zap } from 'lucide-react'
import React from 'react'

const Vantagens = () => {
    const Categoria=[
        {
           titulo:'Preços',
           descricao:'Compra itens usados a preços acessíveis.',
            icon: < DollarSign className="w-8 h-8 text-gray-400" />
        },
        {
            titulo:'Entrega Rápida',
            descricao:'Maioria das transações concluídas em 24-48h.',
            icon: <Box className="w-8 h-8 text-gray-400" />

        },
        {
            titulo:'Comunidade Confiável',
            descricao:'Só Estudantes verificados. Sem burlas, sem esquemas.',
            icon: <Users className="w-8 h-8 text-gray-400" />
        },
        {
            titulo:'Pagamento',
            descricao:'Sistema de pagamento protegido ou encontro presencial.',
            icon: <Receipt className="w-8 h-8 text-gray-400" />
        },
        {
            titulo:'100% Grátis',
            descricao:'zero taxas de registro.',
            icon: <Zap className="w-8 h-8 text-gray-400" />
        },
        {
            titulo:'Avaliações',
            descricao:'Vê a reputação antes de comprar ou vender.',
            icon: <ThumbsUp className="w-8 h-8 text-gray-400" />
        }
    ]
  return (
    <div>
        <div className="bg-gray-200 py-16 px-4"> 
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                      Vantagens Para Ti  
                    </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Categoria.map((item, index) => (
                            <div key={index} className="bg-white p-5 rounded-2xl shadow-sm flex flex-col items-start">
                           
                            <div className="bg-gray-200 p-2 rounded-lg mb-3 text-gray-700">
                                {item.icon}
                            </div>
                            
                            <h3 className="text-black text-xl font-bold mb-2">{item.titulo}</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {item.descricao}
                            </p>
                            </div>
                        ))}
                    </div>

                 </div>
                
         </div>
       
    </div>
  )
}

export default Vantagens