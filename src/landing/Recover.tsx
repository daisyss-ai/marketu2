'use client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

interface RecoverErrors {
  [key: string]: string | undefined;
}

const Recover = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [recoveryMethod, setRecoveryMethod] = useState<'phone' | 'email' | null>(null);

  // Step 2: Phone or Email
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Step 3: SMS Code
  const [smsCode, setSmsCode] = useState(Array(6).fill(''));
  const [codeRequested, setCodeRequested] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Step 4: New Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Error states
  const [errors, setErrors] = useState<RecoverErrors>({});

  const validateStep = (stepNumber: number) => {
    const newErrors: RecoverErrors = {};

    if (stepNumber === 2) {
      if (recoveryMethod === 'phone') {
        if (!phone.trim()) {
          newErrors.phone = 'Número de telemóvel é obrigatório';
        } else if (!/^\+?[0-9]{9,}$/.test(phone.replace(/\s/g, ''))) {
          newErrors.phone = 'Por favor, introduza um número de telemóvel válido';
        }
      } else if (recoveryMethod === 'email') {
        if (!email.trim()) {
          newErrors.email = 'Email é obrigatório';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          newErrors.email = 'Por favor, introduza um email válido';
        }
      }
    } else if (stepNumber === 3) {
      const code = smsCode.join('');
      if (code.length !== 6) {
        newErrors.smsCode = 'Por favor, introduza todos os 6 dígitos';
      } else if (!/^\d{6}$/.test(code)) {
        newErrors.smsCode = 'Código deve conter apenas números';
      }
    } else if (stepNumber === 4) {
      if (!newPassword.trim()) {
        newErrors.newPassword = 'Palavra-passe é obrigatória';
      } else if (newPassword.length < 8) {
        newErrors.newPassword = 'Palavra-passe deve ter no mínimo 8 caracteres';
      }

      if (!confirmPassword.trim()) {
        newErrors.confirmPassword = 'Confirmação de palavra-passe é obrigatória';
      } else if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = 'As palavras-passe não coincidem';
      }
    }

    return newErrors;
  };

  const handleNextStep = async () => {
    const newErrors = validateStep(step);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      if (step === 2) {
        // Step 2 to 3: Send code
        await new Promise((resolve) => setTimeout(resolve, 800));
        setCodeRequested(true);
        setCanResend(false);
        setCountdown(50);
      } else if (step === 3) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      } else if (step === 4) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        router.push('/login');
        return;
      }

      setStep(step + 1);
    } catch (error) {
      setErrors({ submit: 'Erro ao processar. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
    setErrors({});
  };

  const handleSmsCodeChange = (index: number, value: string) => {
    if (/^\d?$/.test(value)) {
      const newCode = [...smsCode];
      newCode[index] = value;
      setSmsCode(newCode);

      if (value && index < 5) {
        const nextInput = document.getElementById(`smsCode-${index + 1}`);
        if (nextInput) nextInput.focus();
      }

      // Auto-verify
      if (newCode.join('').length === 6 && newCode.every(digit => digit !== '')) {
        handleNextStep();
      }
    }
  };

  // Step 1: Choose Recovery Method
  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-foreground mb-2">Recuperar Conta</h1>
        <p className="text-muted leading-relaxed">Não te preocupes. Vamos ajudar-te a recuperar o acesso à tua conta Marketu.</p>
      </div>

      <div className="space-y-4 pt-4">
        <button
          onClick={() => {
            setRecoveryMethod('phone');
            setStep(2);
            setErrors({});
          }}
          className="w-full bg-primary text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-all shadow-md active:scale-[0.98] focus:ring-4 focus:ring-primary/30"
        >
          Usar Número de Telemóvel
        </button>

        <button
          onClick={() => {
            setRecoveryMethod('email');
            setStep(2);
            setErrors({});
          }}
          className="w-full bg-surface border-2 border-primary text-primary font-bold py-4 rounded-2xl hover:bg-primary/5 transition-all focus:ring-4 focus:ring-primary/20"
        >
          Usar Email
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-foreground mb-2">Validar {recoveryMethod === 'phone' ? 'Telemóvel' : 'Email'}</h1>
        <p className="text-muted leading-relaxed">Introduz o teu {recoveryMethod === 'phone' ? 'número' : 'endereço'} para receberes o código.</p>
      </div>

      {recoveryMethod === 'phone' ? (
        <div>
          <label htmlFor="phone" className="block text-foreground text-sm font-semibold mb-2 ml-1">
            Número de Telemóvel
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (errors.phone) setErrors({ ...errors, phone: undefined });
            }}
            className={`w-full px-4 py-3.5 rounded-2xl border-2 transition-all focus:outline-none focus:ring-4 ${
              errors.phone
                ? 'border-error/50 bg-error/5 focus:ring-error/20'
                : 'border-muted/10 bg-surface focus:border-primary focus:ring-primary/20'
            }`}
            placeholder="+244 9XX XXX XXX"
            aria-invalid={!!errors.phone}
          />
          {errors.phone && (
            <p className="text-error text-xs mt-2 font-medium ml-1">{errors.phone}</p>
          )}
        </div>
      ) : (
        <div>
          <label htmlFor="email" className="block text-foreground text-sm font-semibold mb-2 ml-1">
            Email Institucional
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            className={`w-full px-4 py-3.5 rounded-2xl border-2 transition-all focus:outline-none focus:ring-4 ${
              errors.email
                ? 'border-error/50 bg-error/5 focus:ring-error/20'
                : 'border-muted/10 bg-surface focus:border-primary focus:ring-primary/20'
            }`}
            placeholder="seu@email.com"
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-error text-xs mt-2 font-medium ml-1">{errors.email}</p>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={handlePrevStep}
          className="flex-1 bg-surface border-2 border-primary text-primary font-bold py-3.5 rounded-2xl hover:bg-primary/5 transition-all text-sm"
        >
          Voltar
        </button>
        <button
          onClick={handleNextStep}
          disabled={loading}
          className="flex-[2] bg-primary text-white font-bold py-3.5 rounded-2xl hover:opacity-90 disabled:bg-muted/20 disabled:text-muted transition-all shadow-md"
        >
          {loading ? 'Enviando...' : 'Receber Código'}
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center">
        <h1 className="text-3xl font-black text-foreground mb-2">Verificar Código</h1>
        <p className="text-muted leading-relaxed text-sm">Validamos para {recoveryMethod === 'phone' ? phone : email}</p>
      </div>

      <div className="flex gap-2 justify-center py-4">
        {smsCode.map((digit, index) => (
          <input
            key={index}
            id={`smsCode-${index}`}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleSmsCodeChange(index, e.target.value)}
            className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-muted/20 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none bg-surface"
            aria-label={`Dígito ${index + 1}`}
          />
        ))}
      </div>
      
      {errors.smsCode && <p className="text-error text-xs text-center font-medium">{errors.smsCode}</p>}

      <button
        onClick={handlePrevStep}
        className="w-full bg-surface border-2 border-primary text-primary font-bold py-3.5 rounded-2xl hover:bg-primary/5 transition-all text-sm"
      >
        Voltar e corrigir {recoveryMethod === 'phone' ? 'número' : 'email'}
      </button>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-foreground mb-2">Nova Senha</h1>
        <p className="text-muted leading-relaxed">Cria uma senha forte que ainda não tenhas usado.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="newPassword" className="block text-foreground text-sm font-semibold mb-2 ml-1">Palavra-passe</label>
          <input
            id="newPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo 8 caracteres"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full px-4 py-3.5 rounded-2xl border-2 border-muted/10 bg-surface focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all outline-none"
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-foreground text-sm font-semibold mb-2 ml-1">Confirmar Palavra-passe</label>
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Repete a palavra-passe"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3.5 rounded-2xl border-2 border-muted/10 bg-surface focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all outline-none"
          />
        </div>
      </div>
      
      {errors.newPassword && <p className="text-error text-xs font-medium ml-1">{errors.newPassword}</p>}
      {errors.confirmPassword && <p className="text-error text-xs font-medium ml-1">{errors.confirmPassword}</p>}

      <div className="flex gap-3 pt-2">
        <button onClick={handlePrevStep} className="flex-1 bg-surface border-2 border-primary text-primary font-bold py-3.5 rounded-2xl transition-all">Voltar</button>
        <button onClick={handleNextStep} disabled={loading} className="flex-[2] bg-primary text-white font-bold py-3.5 rounded-2xl shadow-md hover:opacity-90 active:scale-[0.98] transition-all">Confirmar</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
      <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-md p-10 border border-muted/10">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        
        {step < 4 && (
          <div className="mt-10 pt-6 border-t border-muted/10 text-center">
            <button onClick={() => router.push('/login')} className="text-primary font-bold text-sm hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-2 py-1">Voltar ao login</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recover;
