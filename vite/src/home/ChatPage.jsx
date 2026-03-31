import React from 'react';
import Header from '../components/layout/Header';

const conversations = [
  { name: 'Maria Candido', lastMessage: 'Oi Maria! Este artigo ainda está...', active: true, time: 'Agora' },
  { name: 'Paulo Combo', lastMessage: 'Foi um prazer!', active: false, time: 'Ontem' },
  { name: 'Eliane Amalia', lastMessage: 'Infelizmente já nao tem', active: false, time: '2 dias' },
];

const ChatPage = () => {
  return (
    <div className="bg-[#EFE7FF] min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-[280px,1fr] gap-6">
          {/* Conversations list */}
          <aside className="bg-white/90 backdrop-blur-sm rounded-3xl p-5 shadow-md border border-white/60">
            <h2 className="text-lg font-semibold mb-4">Mensagens</h2>
            <div className="space-y-2">
              {conversations.map((c) => (
                <button
                  key={c.name}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-left transition-colors ${
                    c.active
                      ? 'bg-[#F3E8FF] border border-[#4B187C]'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {c.name}
                      </div>
                      <span className="text-[10px] text-gray-400">{c.time}</span>
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {c.lastMessage}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {/* Chat window */}
          <section className="bg-white rounded-3xl p-5 md:p-7 shadow-md flex flex-col border border-white/60">
            {/* header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div>
                  <div className="text-sm font-semibold text-gray-900">Maria Candido</div>
                  <div className="text-xs text-green-600 font-medium">Online Agora</div>
                </div>
              </div>
            </div>

            {/* messages */}
            <div className="flex-1 space-y-4 mb-4 overflow-y-auto pr-1">
              <div className="flex flex-col items-start">
                <div className="max-w-xs rounded-2xl bg-gray-100 px-4 py-2 text-sm text-gray-800 shadow-sm">
                  Olá! Este artigo ainda está disponível?
                </div>
                <span className="mt-1 text-[10px] text-gray-400">14:21</span>
              </div>

              <div className="flex flex-col items-end">
                <div className="max-w-xs rounded-2xl bg-[#4B187C] px-4 py-2 text-sm text-white shadow-sm">
                  Sim, está disponível sim! :)
                </div>
                <span className="mt-1 text-[10px] text-gray-300">14:22</span>
              </div>

              <div className="flex flex-col items-end">
                <div className="max-w-xs rounded-2xl bg-[#4B187C] px-4 py-2 text-sm text-white shadow-sm">
                  Posso ajudar com mais alguma coisa?
                </div>
                <span className="mt-1 text-[10px] text-gray-300">14:23</span>
              </div>
            </div>

            {/* input */}
            <div className="mt-auto">
              <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 shadow-inner">
                <input
                  type="text"
                  placeholder="Escreva uma mensagem..."
                  className="flex-1 bg-transparent outline-none text-sm text-gray-700"
                />
                <button className="ml-3 w-9 h-9 rounded-full bg-[#4B187C] text-white flex items-center justify-center text-xs hover:bg-[#3E1367] transition-colors">
                  Enviar
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ChatPage;

