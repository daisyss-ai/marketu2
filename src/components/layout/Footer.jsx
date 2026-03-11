import React from 'react'

const Footer = () => {
  return (
    <div>
        <div className="bg-[#4b2a8c] text-white py-24 text-center">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                <div>
                    <h3 className=" text-white text-xl font-bold mb-4">MARKETU</h3>
                    <p className="text-sm leading-relaxed">O melhor marketplace para os estudantes angolanos comprarem e venderem com confiança.</p>
                </div>

                 <div>
                        <h3 className=" text-white text-xl font-bold mb-4">Links Rápidos</h3>
                        <ul className="space-y-2  text-sm">
                        <li><a href="#">Guia do Vendedor</a></li>
                        <li><a href="#">Como Funciona</a></li>
                        <li><a href="#">Categorias</a></li>
                        <li><a href="#">Sobre Nós</a></li>
                    </ul>
                 </div>
                 <div>
                     <h3 className=" text-white text-xl font-bold mb-4 border-b-2 border-white pb-2">Suporte</h3>

                    <ul className="space-y-2  text-sm">
                        <li><a href="#">Central de Ajuda</a></li>
                        <li><a href="#">Segurança</a></li>
                        <li><a href="#">Contatos</a></li>
                        <li><a href="#">FAQ</a></li>
                    </ul>
                 </div>
                <div >
                    <h3 className=" text-white text-xl font-bold mb-4 border-b-2 border-white pb-2">Legal</h3>
                    <ul className="space-y-2  text-sm">
                        <li><a href="#">Termos de Serviço</a></li>
                        <li><a href="#">Política de Privacidade</a></li>
                        <li><a href="#">Política de Cookies</a></li>
                        <li><a href="#">Acessibilidade</a></li>
                    </ul>
                </div>
                
                <div className="col-span-full flex flex-col items-center w-full mt-8"> 
                              <h3 className="text-center text-lg font-semibold mb-6">
                              Receba as novidades do Marketu
                              </h3>

                      <form className="flex flex-col sm:flex-row gap-2 w-full max-w-2xl">
                          <input 
                            type="email" 
                            placeholder="Seu e-mail" 
                            className="flex-1 p-4 rounded-md bg-white/90 text-gray-700 outline-none w-full focus:ring-2 focus:ring-purple-400"
                          />

                          <button className="bg-[#6d28d9] px-10 py-4 rounded-md font-bold border border-purple-400 hover:bg-[#5b21b6] transition-all w-full sm:w-auto">
                            Subscrever
                          </button>  
                      </form>
                  </div>       
            </div>
        </div>
    </div>
  )
}

export default Footer