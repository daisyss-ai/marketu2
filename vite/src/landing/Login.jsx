import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Login = () => {
  const navigate = useNavigate();
  const loginStore = useAuthStore((state) => state.login);
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const validateForm = () => {
    const newErrors = {};

    // Student ID or Phone validation
    if (!studentId.trim()) {
      newErrors.studentId = 'ID de Estudante ou Telemóvel é obrigatório';
    } else if (studentId.trim().length < 5) {
      newErrors.studentId = 'Por favor, introduza um ID ou telemóvel válido';
    }

    // Password validation
    if (!password.trim()) {
      newErrors.password = 'Palavra-passe é obrigatória';
    } else if (password.length < 6) {
      newErrors.password = 'Palavra-passe deve ter no mínimo 6 caracteres';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccess('');

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess('Login realizado com sucesso!');
      // store user info (for now just id)
      loginStore({ id: studentId });
      // clear form fields
      setStudentId('');
      setPassword('');
      setRememberMe(false);
      setShowPassword(false);
      // navigate to marketplace after short delay
      setTimeout(() => navigate('/home'), 500);
    } catch (error) {
      setErrors({ submit: 'Erro ao fazer login. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Light Gray */}
      <div className="hidden md:flex md:w-1/2 bg-gray-100 items-center justify-center relative">
        <div className="absolute top-12 left-12 w-24 h-24 bg-purple-600 rounded-full"></div>
      </div>

      {/* Right Side - Purple */}
      <div className="w-full md:w-1/2 bg-purple-600 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo - Visible on mobile only */}
          <div className="md:hidden mb-8 flex justify-start">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full"></div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-white mb-2">Entrar</h1>
          <p className="text-purple-100 mb-8">Acede à tua conta Marketu</p>

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded text-sm">
              {success}
            </div>
          )}

          {/* Error Message */}
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
              {errors.submit}
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Student ID / Phone */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                ID de Estudante ou Telemóvel
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value);
                  if (errors.studentId) setErrors({ ...errors, studentId: '' });
                }}
                className={`w-full px-4 py-3 rounded border-0 focus:outline-none focus:ring-2 ${
                  errors.studentId
                    ? 'bg-red-100 focus:ring-red-500'
                    : 'bg-white focus:ring-purple-300'
                }`}
                placeholder="Ex: 2034xx-xxx + 244 XXX-XXX"
              />
              {errors.studentId && (
                <p className="text-red-200 text-xs mt-1">{errors.studentId}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Palavra-passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  className={`w-full px-4 py-3 pr-12 rounded border-0 focus:outline-none focus:ring-2 ${
                    errors.password
                      ? 'bg-red-100 focus:ring-red-500'
                      : 'bg-white focus:ring-purple-300'
                  }`}
                  placeholder="Digite a tua palavra-passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-600 hover:text-gray-800"
                  title={showPassword ? 'Mascarar' : 'Desmascarar'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06L3.28 2.22zM10 3.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zm0 2a4.5 4.5 0 014.233 7.021.75.75 0 01-1.06-1.06A3 3 0 109.5 10a.75.75 0 011.5 0 4.5 4.5 0 01-1 2.66.75.75 0 01-1.19-.94A3 3 0 109.5 7a.75.75 0 01-1.5 0 4.5 4.5 0 013-4.5z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-200 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded accent-white cursor-pointer"
              />
              <label htmlFor="rememberMe" className="ml-2 text-white text-sm cursor-pointer">
                Lembrar-me neste dispositivo
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-purple-600 font-semibold py-3 rounded hover:bg-gray-100 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 border-t border-purple-400"></div>

          {/* Footer Links */}
          <div className="text-center space-y-2">
            <p className="text-purple-200 text-sm">
              <a href="/recover" className="text-pink-300 hover:underline">Esqueceste a palavra-passe?</a>
            </p>
            <p className="text-purple-200 text-sm">
              Ainda não tens conta?{' '}
              <button 
                onClick={() => navigate('/signup')}
                className="text-pink-300 hover:underline font-semibold cursor-pointer"
              >
                Criar agora
              </button>
            </p>
          </div>
          <p className="mt-4 text-xs text-purple-200">
            Os teus dados estão seguros e não serão partilhados com terceiros.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
