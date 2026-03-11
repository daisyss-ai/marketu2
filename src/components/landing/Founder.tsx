import React from 'react'

const Founder = () => {
  return (
    <div>
        <div className="bg-gray-200 py-16">
            <div className="bg-gradient-to-r from-[#7b46cc] to-[#5a2da1] rounded-xl p-8 text-center max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold text-white mb-4">
                   Seja um Membro Fundador!
                </h2>
              <p className="text-purple-100 mb-6 text-sm">
                Regista-te agora e seja um dos primeiros a usar o <b className="text-white">Maketu </b>no IPIL/Makarenco
              </p>
              <div className="max-w-[350px] mx-auto space-y-4">
                        <input 
                        type="text" 
                        placeholder="Nome Completo" 
                        className="w-full p-3 mb-2 rounded-md text-gray-800 bg-white/90 placeholder-gray-500 outline-none" 
                        />
                    <input 
                    type="text" 
                    placeholder="ID de Estudante/Nº de Processo" 
                    className="w-full p-3 mb-2 rounded-md  text-gray-800  placeholder-gray-500 bg-white/90 outline-none" 
                    />
                    <input 
                    type="email" 
                    placeholder="Email(opcional)" 
                    className="w-full p-3 rounded-md bg-white/90  placeholder-gray-500 outline-none"
                    />   
              </div>
              <div className="text-left py-2 space-y-2 text-white max-w-[350px] mx-auto mt-4">
                    <label className="flex items-center gap-2 text-[15px] cursor-pointer hover:opacity-80">
                        <input type="checkbox" className="w-3 h-3 accent-blue-500" defaultChecked />
                        Concordo com os Termos de Uso
                    </label>
                    <label className="flex items-center gap-2 text-[15px] cursor-pointer hover:opacity-80">
                        <input type="checkbox" className="w-3 h-3 accent-blue-500" defaultChecked />
                        Quero receber ofertas exclusivas e novidades
                    </label>
              </div>
              <button className="w-fit px-8 mx-auto bg-white text-[#5a2da1] p-3 font-bold rounded-md shadow-md hover:bg-gray-100 mt-2 mb-4  transition-colors text-sm">
                Registrar Como Fundador
              </button>

                <div className="text-white pt-6 border-t border-white/90 mt-6">
                    <p className="text-[10px] opacity-70">Os teus dados estão seguros e nunca serão partilhados.</p>
                    <p className="text-[11px] mt-1">Já tens conta? <a href=""> Entrar aqui</a> </p>
                </div>

            </div>
        </div>
    </div>
  )
} 

export default Founder