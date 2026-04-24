'use client';
import { login } from '@/app/auth/actions';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface LoginProps {
  onFlipToSignup?: () => void;
  onSlideToSignup?: () => void;
}

const Login = ({ onFlipToSignup, onSlideToSignup }: LoginProps) => {
  const handleSwitch = onFlipToSignup || onSlideToSignup;
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const goToSignup = () => {
    if (handleSwitch) return handleSwitch();
    router.push('/signup');
  };

  const validateForm = () => {
    const newErrors: any = {};

    // Email validation (Supabase Auth uses email/password)
    if (!email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      newErrors.email = 'Por favor, introduza um email válido';
    }

    // Password validation
    if (!password.trim()) {
      newErrors.password = 'Palavra-passe é obrigatória';
    } else if (password.length < 6) {
      newErrors.password = 'Palavra-passe deve ter no mínimo 6 caracteres';
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
  };

  return (
    <div className="flex bg-surface rounded-2xl overflow-hidden shadow-xl w-full max-w-4xl min-h-125">
      {/* Left Side - Light Gray */}
      <div className="hidden md:flex md:w-1/2 bg-background items-center justify-center relative">
        <div className="text-center p-8">
          <div className="w-24 h-24 bg-primary rounded-full mx-auto mb-6 flex items-center justify-center text-white text-4xl font-extrabold shadow-lg">mU</div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Bem-vindo de volta!</h2>
          <p className="text-muted leading-relaxed">Para te manteres ligado a nós, por favor faz login com os teus dados pessoais</p>
        </div>
      </div>

      {/* Right Side - Primary Action Color */}
      <div className="w-full md:w-1/2 bg-primary flex items-center justify-center px-8 py-12">
        <div className="w-full">
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">Entrar</h1>
          <p className="text-primary-foreground/80 mb-8 text-sm">Acede à tua conta Marketu</p>

          {errors.submit && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
              {errors.submit}
            </div>
          )}

          <form className="space-y-5" action={login} onSubmit={handleSubmit}>
            <div>
              <label htmlFor="studentId" className="block text-white text-sm font-semibold mb-2">
                Email
              </label>
              <input
                id="studentId"
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                className={`w-full px-4 py-3 rounded-xl border-0 focus:outline-none focus:ring-4 transition-all text-sm ${
                  errors.email
                    ? 'bg-error/5 text-error focus:ring-error/30'
                    : 'bg-surface text-foreground focus:ring-primary/40'
                }`}
                placeholder="nome@instituicao.edu"
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-red-100 text-xs mt-1.5 font-medium">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-white text-sm font-semibold mb-2">
                Palavra-passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  className={`w-full px-4 py-3 pr-12 rounded-xl border-0 focus:outline-none focus:ring-4 transition-all text-sm ${
                    errors.password
                      ? 'bg-error/5 text-error focus:ring-error/30'
                      : 'bg-surface text-foreground focus:ring-primary/40'
                  }`}
                  placeholder="Min. 6 caracteres"
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-primary hover:text-primary/80 transition-colors min-w-11 min-h-11 flex items-center justify-center"
                  aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-100 text-xs mt-1.5 font-medium">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-white cursor-pointer"
                />
                <label htmlFor="rememberMe" className="ml-2 text-white text-xs cursor-pointer">
                  Lembrar-me
                </label>
              </div>
              <Link href="/recover" className="text-white text-xs hover:underline">Esqueceste a senha?</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-surface text-primary font-bold py-3.5 rounded-xl hover:bg-background disabled:opacity-50 transition-all text-sm mt-4 shadow-lg active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-primary/40"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-primary-foreground/80 text-xs">
              Ainda não tens conta?{' '}
              <button
                type="button"
                onClick={goToSignup}
                className="text-primary-foreground hover:underline font-bold"
              >
                Criar agora
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
