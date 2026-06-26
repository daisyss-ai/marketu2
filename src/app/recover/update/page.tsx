'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { updatePassword } from '@/app/auth/actions';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!password || password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      const result = await updatePassword({ password });
      if (!result.success) {
        setError(result.error ?? 'Erro ao atualizar senha. Tenta novamente.');
        return;
      }
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3.5 rounded-2xl border-2 border-muted/10 bg-surface focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all outline-none";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
      <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-md p-10 border border-muted/10">

        {!done ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h1 className="text-3xl font-black text-foreground mb-2">Nova Senha</h1>
              <p className="text-muted text-sm leading-relaxed">
                Escolhe uma senha nova para a tua conta MarketU.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-foreground text-sm font-semibold mb-2 ml-1">
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    className={`${inputClass} pr-11`}
                    placeholder="Mín. 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary/30"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-foreground text-sm font-semibold mb-2 ml-1">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                    className={`${inputClass} pr-11`}
                    placeholder="Repete a senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary/30"
                    aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-error text-sm font-medium ml-1">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-2xl hover:opacity-90 disabled:opacity-60 transition-all shadow-md active:scale-[0.98]"
            >
              {loading ? 'A guardar...' : 'Guardar nova senha'}
            </button>
          </div>
        ) : (
          <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground mb-2">Senha atualizada!</h1>
              <p className="text-muted text-sm leading-relaxed">
                A tua senha foi alterada com sucesso. Já podes entrar na tua conta.
              </p>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-2xl hover:opacity-90 transition-all shadow-md"
            >
              Ir para o login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}