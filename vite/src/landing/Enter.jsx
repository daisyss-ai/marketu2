import React from 'react';
import { useNavigate } from 'react-router-dom';

const Enter = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Logo Circle */}
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">MARKETU</span>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Bem-vindo ao Marketu
        </h1>

        {/* Subheading */}
        <p className="text-gray-600 mb-8 text-lg">
          O marketplace dos estudantes angolanos
        </p>

        {/* Buttons */}
        <div className="space-y-4">
          {/* Signup Button */}
          <button
            onClick={() => navigate('/signup')}
            className="w-full block bg-purple-600 text-white font-semibold py-3 rounded hover:bg-purple-700 transition-colors"
          >
            Ativar a minha Conta
          </button>

          {/* Login Button */}
          <button
            onClick={() => navigate('/login')}
            className="w-full block border-2 border-purple-600 text-purple-600 font-semibold py-3 rounded hover:bg-purple-50 transition-colors"
          >
            Já tenho conta - Entrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Enter;
