import React from 'react'

const Card = () => {
  return (
    <div>
         <div  className="bg-gray-200 py-16">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-8 text-center">
            <h2 className="text-2xl font-semibold mb-3">
              Lançamento Exclusivo
            </h2>
        <p className=" text-gray-600 mb-6">
         <b>IPIL/Makarenco</b> será o primeiro instituto em Angola a ter acesso!
         <br />
          Seja um dos primeiros 1000 estudantes a juntar-se e desbloqueie vantagens exclusivas.  
        </p>
            <div className="text-left inline-block text-gray-600 space-y-2 mb-8">
                <p>• Suporte VIP no site por 3 meses</p>
                <p>• Budget de Membro Fundador no teu perfil</p>
                <p>• Acesso prioritário a novas funcionalidades.</p>
    </div>

        <div className="flex justify-center">
          <button className="bg-[#6a0dad] mt-3 text-white px-6 py-2 rounded-md hover:bg-purple-800">
            Saber mais
          </button>
        </div>
      </div>
   

        </div>
     

    </div>
  )
}

export default Card