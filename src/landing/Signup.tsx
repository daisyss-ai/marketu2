'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import InstitutionSelect from '@/components/InstitutionSelect';
import { signup, sendVerificationCode, verifyVerificationCode } from '@/app/auth/actions';

const signupSchema = z.object({
  studentId: z.string()
  .min(1, 'O ID é obrigatório')
  .refine(
    (val) => /^\d{5}$/.test(val),
    {
      message: 'O ID deve conter exatamente 5 dígitos numéricos (ex: 12345). IDs negativos não são válidos.',
    }
  ),
  fullName: z.string()
    .min(3, 'O nome deve ter pelo menos 3 caracteres')
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/, 'O nome não pode conter números ou símbolos'),
  email: z.string().email('Email inválido'),
  institution: z.string().min(1, 'Instituição inválida'),
  phone: z.string()
    .optional()
    .refine(
      (val) => !val || /^9\d{8}$/.test(val),
      { message: 'Número inválido, usa o formato 9xx xxx xxx' }
    ),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(1, 'Obrigatório'),
}).superRefine(({ password, confirmPassword }, ctx) => {
  if (password !== confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmPassword'],
      message: 'Senhas diferentes',
    });
  }
});

type SignupFormData = z.infer<typeof signupSchema>;

interface SignupProps {
  onFlipToLogin?: () => void;
  onSlideToLogin?: () => void;
}

const Signup = ({ onFlipToLogin, onSlideToLogin }: SignupProps) => {
  const handleSwitch = onFlipToLogin || onSlideToLogin;
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '';
  const serverError = searchParams.get('error');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [institutionName, setInstitutionName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [verificationError, setVerificationError] = useState('');
  const [resending, setResending] = useState(false);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const goToLogin = () => {
    if (handleSwitch) return handleSwitch();
    router.push(redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : '/login');
  };

  const { register, control, watch, trigger, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      studentId: '',
      fullName: '',
      email: '',
      institution: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const watchedStudentId = watch('studentId');
  const watchedFullName = watch('fullName');
  const watchedInstitution = watch('institution');
  const watchedPhone = watch('phone');
  const watchedEmail = watch('email');

  const handleStep1Next = async () => {
    const valid = await trigger(['studentId', 'fullName', 'email', 'institution']);
    if (!valid) return;
    setStep(2);
  };

  const handleStep2Next = async () => {
    setConfirmError('');
    setLoading(true);
    try {
      const result = await sendVerificationCode({
        studentId: watchedStudentId,
        fullName: watchedFullName,
        email: watchedEmail,
        institutionId: watchedInstitution,
      });
      if (!result.success) {
        setConfirmError(result.error ?? 'Não foi possível enviar o código. Tenta novamente.');
        return;
      }
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...verificationCode];
    next[index] = digit;
    setVerificationCode(next);
    if (digit && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      setVerificationError('Introduz os 6 dígitos do código.');
      return;
    }
    setVerificationError('');
    setLoading(true);
    try {
      const result = await verifyVerificationCode({ email: watchedEmail, token: code });
      if (!result.success) {
        setVerificationError(result.error ?? 'Código inválido. Tenta novamente.');
        return;
      }
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    setVerificationError('');
    try {
      const result = await sendVerificationCode({
        studentId: watchedStudentId,
        fullName: watchedFullName,
        email: watchedEmail,
        institutionId: watchedInstitution,
      });
      if (!result.success) {
        setVerificationError(result.error ?? 'Não foi possível reenviar o código.');
      }
    } finally {
      setResending(false);
    }
  };

  const handleStep4Next = async () => {
    const valid = await trigger(['phone']);
    if (!valid) return;
    setStep(5);
  };

  const handleFinalSubmit = async () => {
    const valid = await trigger(['password', 'confirmPassword']);
    if (!valid) return;
    setLoading(true);
    const form = document.getElementById('signup-form') as HTMLFormElement;
    form.requestSubmit();
  };

  const renderStep = () => {
    const inputClass = "w-full px-4 py-3 rounded-xl border border-muted/20 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all bg-surface text-foreground placeholder:text-muted/50";
    const buttonClass = "w-full bg-primary text-white py-3.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-md active:scale-[0.98] focus:ring-4 focus:ring-primary/30";
    const secondaryButtonClass = "flex-1 border-2 border-primary text-primary py-3 rounded-xl font-bold hover:bg-primary/5 transition-all text-sm";

    switch (step) {
      case 1:
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-2xl font-extrabold text-foreground mb-1">Criar Conta</h2>
              <p className="text-muted text-sm mb-6">Começa o teu registo como estudante</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="studentId" className="block text-sm font-semibold text-foreground mb-1.5 ml-1">
                  ID Estudante
                </label>
                <input
                  id="studentId"
                  placeholder="Ex: 12345"
                  inputMode="numeric"
                  maxLength={6}
                  {...register('studentId')}
                  className={inputClass}
                  aria-invalid={!!errors.studentId}
                />
                {errors.studentId && (
                  <p className="text-error text-xs mt-1 ml-1 font-medium">{errors.studentId.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-foreground mb-1.5 ml-1">Nome Completo</label>
                <input
                  id="fullName"
                  placeholder="Teu nome como no BI"
                  {...register('fullName')}
                  className={inputClass}
                  aria-invalid={!!errors.fullName}
                />
                {errors.fullName && <p className="text-error text-xs mt-1 ml-1 font-medium">{errors.fullName.message}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-1.5 ml-1">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="nome@email.com"
                  {...register('email')}
                  className={inputClass}
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p className="text-error text-xs mt-1 ml-1 font-medium">{errors.email.message}</p>}
              </div>

              <Controller
                control={control}
                name="institution"
                render={({ field }) => (
                  <InstitutionSelect
                    value={field.value}
                    onChange={field.onChange}
                    onOptionChange={(option) => setInstitutionName(option?.label ?? '')}
                    name={field.name}
                    ref={field.ref}
                    error={errors.institution?.message as string}
                  />
                )}
              />
            </div>

            <button type="button" onClick={handleStep1Next} className={buttonClass} disabled={loading}>Continuar</button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-2xl font-extrabold text-foreground mb-1">Confirmar Dados</h2>
              <p className="text-muted text-sm">Verifica se as informações abaixo estão corretas</p>
            </div>

            <div className="bg-primary/5 border border-primary/10 p-5 rounded-2xl text-sm space-y-3">
              <div className="flex justify-between border-b border-primary/10 pb-2">
                <span className="text-muted font-medium">Nome:</span>
                <span className="text-foreground font-bold">{watchedFullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted font-medium">Instituição:</span>
                <span className="text-foreground font-bold">{institutionName || 'Não informada'}</span>
              </div>
            </div>
            <p className="text-muted text-xs text-center -mt-2">Curso e turma podem ser definidos mais tarde no teu perfil.</p>

            {confirmError && <p className="text-error text-sm font-medium text-center">{confirmError}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className={secondaryButtonClass} disabled={loading}>Voltar</button>
              <button type="button" onClick={handleStep2Next} disabled={loading} className="flex-[2] bg-primary text-white py-3 rounded-xl font-bold hover:opacity-90 shadow-md">
                {loading ? 'A enviar...' : 'Sim, sou eu'}
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-2xl font-extrabold text-foreground mb-1">Código de Verificação</h2>
              <p className="text-muted text-sm">Enviamos um código de 6 dígitos para {watchedEmail}</p>
            </div>

            <div className="flex justify-center gap-2">
              {verificationCode.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { codeInputRefs.current[i] = el; }}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  inputMode="numeric"
                  className="w-12 h-14 border-2 border-muted/20 rounded-xl text-center text-xl font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  maxLength={1}
                  aria-label={`Dígito ${i + 1} do código de verificação`}
                />
              ))}
            </div>

            {verificationError && <p className="text-error text-sm font-medium">{verificationError}</p>}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(2)} className={secondaryButtonClass} disabled={loading}>Voltar</button>
              <button type="button" onClick={handleVerifyCode} disabled={loading} className="flex-[2] bg-primary text-white py-3 rounded-xl font-bold hover:opacity-90 shadow-md">
                {loading ? 'A verificar...' : 'Verificar'}
              </button>
            </div>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resending}
              className="text-sm text-primary font-bold hover:underline disabled:opacity-50"
            >
              {resending ? 'A reenviar...' : 'Reenviar código'}
            </button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-2xl font-extrabold text-foreground mb-1">Telemóvel</h2>
              <p className="text-muted text-sm mb-6">Deixa um número de contacto (opcional)</p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-foreground mb-1.5 ml-1">
                Número de Telemóvel <span className="text-muted font-normal">(opcional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="9xx xxx xxx"
                {...register('phone')}
                className={inputClass}
                aria-invalid={!!errors.phone}
              />
              {errors.phone && <p className="text-error text-xs mt-1 ml-1 font-medium">{errors.phone.message}</p>}
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(3)} className={secondaryButtonClass} disabled={loading}>Voltar</button>
              <button type="button" onClick={handleStep4Next} disabled={loading} className="flex-[2] bg-primary text-white py-3 rounded-xl font-bold hover:opacity-90 shadow-md">Continuar</button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-2xl font-extrabold text-foreground mb-1">Escolhe uma Senha</h2>
              <p className="text-muted text-sm mb-6">Garante que a tua conta está protegida</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-1.5 ml-1">Nova Senha</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 caracteres"
                    {...register('password')}
                    className={`${inputClass} pr-11`}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary/30"
                    aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-foreground mb-1.5 ml-1">Confirmar Senha</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repete a senha"
                    {...register('confirmPassword')}
                    className={`${inputClass} pr-11`}
                    aria-invalid={!!errors.confirmPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary/30"
                    aria-label={showConfirmPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {errors.password && <p className="text-error text-sm font-medium">{errors.password.message}</p>}
            {errors.confirmPassword && <p className="text-error text-sm font-medium">{errors.confirmPassword.message}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(4)} className={secondaryButtonClass} disabled={loading}>Voltar</button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={loading}
                className="flex-[2] bg-primary text-white py-3 rounded-xl font-bold hover:opacity-90 shadow-md disabled:opacity-60"
              >
                {loading ? 'A criar conta...' : 'Criar Conta'}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const progressSteps = [1, 2, 3, 4, 5];

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen">

      {/* ── Painel esquerdo ── */}
      <div className="
        bg-primary
        flex flex-col items-center justify-center
        py-8 px-6 gap-4
        md:w-2/5 md:py-12 md:px-10 md:gap-6
        md:m-3 md:rounded-3xl
        shadow-2xl
        overflow-hidden
      ">
        <div className="flex items-center gap-2 self-start md:self-center">
          <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-xs">M</span>
          </div>
          <span className="text-white font-semibold text-base tracking-wide">MarketU</span>
        </div>

        <Image
          src="/assets/Ecommerce checkout laptop-amico.png"
          alt="Ilustração de checkout de marketplace estudantil"
          width={399}
          height={399}
          className="w-[168px] md:w-full max-w-[336px] object-contain"
          priority
        />

        <p className="text-white/80 text-sm text-center leading-relaxed max-w-[220px]">
          O primeiro marketplace exclusivo<br />para estudantes da tua instituição.
        </p>

        <span className="text-white/70 text-xs font-medium bg-white/10 px-3 py-1.5 rounded-full">
          +500 estudantes já usam o MarketU
        </span>
      </div>

      {/* ── Painel direito — formulário ── */}
      <form
        id="signup-form"
        action={signup}
        className="w-full md:w-3/5 bg-surface flex items-center justify-center px-6 py-8 md:px-10 md:py-12"
      >
        <input type="hidden" name="studentId" value={watchedStudentId ?? ''} readOnly />
        <input type="hidden" name="fullName" value={watchedFullName ?? ''} readOnly />
        <input type="hidden" name="institution" value={watchedInstitution ?? ''} readOnly />
        <input type="hidden" name="phone" value={watchedPhone ?? ''} readOnly />
        <input type="hidden" name="redirectTo" value={redirectTo} readOnly />

        <div className="w-full max-w-md">
          {step < 6 && (
            <div className="flex justify-between mb-10 px-2">
              {progressSteps.map(i => (
                <div key={i} className={`h-1.5 flex-1 mx-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-primary' : 'bg-muted/10'}`} />
              ))}
            </div>
          )}
          {serverError && (
            <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-medium" role="alert">
              {serverError}
            </div>
          )}
          {renderStep()}
          {step < 6 && (
            <p className="mt-8 text-center text-sm text-muted">
              Já tens conta?{' '}
              <button
                type="button"
                onClick={goToLogin}
                className="text-primary font-bold hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1"
              >
                Entrar aqui
              </button>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default Signup;

