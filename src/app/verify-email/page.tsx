'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

const VerifyEmail = () => {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSubmitted, setCodeSubmitted] = useState(false);

  // Redirect if already verified
  useEffect(() => {
    if (user?.studentIdVerified) {
      router.push('/home');
    }
  }, [user?.studentIdVerified, router]);

  // Handle resend cooldown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || !user?.email) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // In a real implementation, you would call an API endpoint to resend verification
      // For now, we'll just show a message
      setMessage('Email de verificação reenviado para ' + user.email);
      setResendCooldown(60); // 60 second cooldown
    } catch (err) {
      setError('Erro ao reenviar email. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode.trim()) {
      setError('Por favor, introduza o código de verificação');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // In a real implementation, you would verify the code with your backend
      // For now, we'll show a message that they should click the link in the email
      setMessage('Código recebido. Se o código for válido, a sua conta será verificada automaticamente.');
      
      // Simulate account verification (in real app, this would be from backend)
      setTimeout(() => {
        if (user) {
          setUser({
            ...user,
            studentIdVerified: true,
          });
          setMessage('Conta verificada com sucesso!');
          setTimeout(() => router.push('/home'), 1000);
        }
      }, 2000);
    } catch (err) {
      setError('Erro ao verificar código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 p-4">
        <div className="max-w-md w-full">
          <div className="bg-surface rounded-2xl p-8 shadow-lg border border-muted/10">
            <p className="text-center text-muted">Redirecionando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 p-4">
      <div className="max-w-md w-full">
        <div className="bg-surface rounded-2xl p-8 shadow-lg border border-muted/10">
          <div className="mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center text-primary text-2xl">
              ✉️
            </div>
            <h1 className="text-2xl font-extrabold text-foreground mb-2 text-center">Verificar Email</h1>
            <p className="text-muted text-center text-sm">
              Enviámos um email de verificação para <strong>{user.email}</strong>
            </p>
          </div>

          {message && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="code" className="block text-sm font-semibold text-foreground mb-2">
                Código de Verificação
              </label>
              <input
                id="code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Introduza o código do email"
                className="w-full px-4 py-3 rounded-xl border border-muted/20 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all bg-surface text-foreground"
              />
            </div>

            <button
              onClick={handleVerifyCode}
              disabled={loading || !verificationCode.trim()}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all text-sm"
            >
              {loading ? 'Verificando...' : 'Verificar Código'}
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface text-muted">ou</span>
            </div>
          </div>

          <p className="text-center text-muted text-sm mb-4">
            Não recebeu o email? Clique no link de confirmação no email ou reenvie-o abaixo.
          </p>

          <button
            onClick={handleResendEmail}
            disabled={loading || resendCooldown > 0}
            className="w-full bg-surface border-2 border-primary text-primary font-bold py-3.5 rounded-xl hover:bg-primary/5 disabled:opacity-50 transition-all text-sm"
          >
            {resendCooldown > 0
              ? `Reenviar em ${resendCooldown}s`
              : 'Reenviar Email de Verificação'}
          </button>

          <p className="text-center text-muted text-xs mt-4">
            <a href="/login" className="text-primary hover:underline">Voltar ao login</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
