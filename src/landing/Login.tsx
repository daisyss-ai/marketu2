'use client';
import { login } from '@/app/auth/actions';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';

interface LoginProps {
  onFlipToSignup?: () => void;
  onSlideToSignup?: () => void;
}

const Login = ({ onFlipToSignup, onSlideToSignup }: LoginProps) => {
  const handleSwitch = onFlipToSignup || onSlideToSignup;
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const goToSignup = () => {
    if (handleSwitch) return handleSwitch();
    router.push('/signup');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      newErrors.email = 'Introduz um email válido';
    }
    if (!password.trim()) {
      newErrors.password = 'Palavra-passe é obrigatória';
    } else if (password.length < 6) {
      newErrors.password = 'Mínimo de 6 caracteres';
    }
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      e.preventDefault();
      setErrors(newErrors);
      toast.error('Verifique os campos e tente novamente');
      return;
    }
    setLoading(true);
    // Reset de segurança: desbloqueia o botão após 8s caso o servidor não responda
    setTimeout(() => setLoading(false), 8000);
  };

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen">

      {/* ── Painel esquerdo ── */}
      {/* ── Painel esquerdo ── */}
<div className="
  bg-[#4b2a8c]
  flex flex-col items-center justify-center
  py-8 px-6 gap-4
  md:w-2/5 md:py-12 md:px-10 md:gap-6
  md:m-3 md:rounded-3xl
  shadow-2xl
  overflow-hidden
">
  {/* Logo + nome — visível em mobile e desktop */}
  <div className="flex items-center gap-2 self-start md:self-center">
    <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center">
      <span className="text-white font-bold text-xs">M</span>
    </div>
    <span className="text-white font-semibold text-base tracking-wide">MarketU</span>
  </div>

  <Image
    src="/assets/Ecommerce web page-amico (1).png"
    alt="Ilustração de marketplace estudantil"
    width={399}
    height={399}
    className="w-[168px] md:w-full max-w-[336px] object-contain"
    priority
  />

  {/* Tagline — agora visível também no mobile */}
  <p className="text-white/80 text-sm text-center leading-relaxed max-w-[220px]">
    Vende o que tens.<br />
    Compra o que precisas.
  </p>

  {/* Elemento de confiança — agora visível também no mobile */}
  <span className="text-white/70 text-xs font-medium bg-white/10 px-3 py-1.5 rounded-full">
    +500 estudantes já usam o MarketU
  </span>
</div>
      {/* ── Painel direito — formulário ── */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center px-6 py-8 md:px-10 md:py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Entrar</h1>
          <p className="text-gray-500 text-sm mb-8">Acede à tua conta MarketU</p>

          {errors.submit && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm" role="alert">
              {errors.submit}
            </div>
          )}

          <form className="space-y-5" action={login} onSubmit={handleSubmit}>
            <input type="hidden" name="redirectTo" value={redirectTo} readOnly />

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                autoComplete="email"
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.email
                    ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-200'
                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-[#4b2a8c]/30 focus:border-[#4b2a8c]'
                }`}
                placeholder="teu@email.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : 'email-helper'}
              />
              {!errors.email && (
                <p id="email-helper" className="text-gray-400 text-xs mt-1.5">
                  Podes usar o e-mail da escola ou pessoal
                </p>
              )}
              {errors.email && (
                <p id="email-error" className="text-red-500 text-xs mt-1.5" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Palavra-passe */}
            <div>
              <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-1.5">
                Palavra-passe
              </label>
              <div className="relative">
                <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                autoComplete="current-password"
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                className={`w-full px-4 py-2.5 pr-11 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.password
                    ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-200'
                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-[#4b2a8c]/30 focus:border-[#4b2a8c]'
                }`}
                placeholder="Mín. 6 caracteres"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#4b2a8c] transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-[#4b2a8c]/30"
                aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-red-500 text-xs mt-1.5" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Lembrar-me + Esqueceste */}
            <div className="flex items-center justify-between">
              <label htmlFor="rememberMe" className="flex items-center gap-2 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#4b2a8c] cursor-pointer"
                />
                <span className="text-gray-500 text-xs">Lembrar-me</span>
              </label>
              <Link href="/recover" className="text-[#4b2a8c] text-xs hover:underline py-1">
                Esqueceste a senha?
              </Link>
            </div>

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4b2a8c] hover:bg-[#3d2275] text-white font-semibold py-2.5 rounded-lg disabled:opacity-60 transition-all text-sm focus:outline-none focus:ring-2 focus:ring-[#4b2a8c]/40 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading && (
                <svg
                  className="animate-spin w-4 h-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
              )}
              {loading ? 'A entrar...' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-500 text-xs">
            Ainda não tens conta?{' '}
            <button
              type="button"
              onClick={goToSignup}
              className="text-[#4b2a8c] font-semibold hover:underline"
            >
              Criar agora
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;