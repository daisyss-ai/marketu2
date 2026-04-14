'use client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import InstitutionSelect from '@/components/InstitutionSelect';
import { signup } from '@/app/auth/actions';

const OTP_ENABLED = false;

const signupSchema = z.object({
  studentId: z.string().min(1, 'Obrigatório'),
  fullName: z.string().min(1, 'Obrigatório'),
  email: z.string().email('Email inválido'),
  institution: z.string().min(1, 'Escolhe a tua instituição'),
  phone: z.string().min(1, 'Obrigatório'),
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
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const goToLogin = () => {
    if (handleSwitch) return handleSwitch();
    router.push('/login');
  };

  const { register, control, watch, trigger, getValues, formState: { errors } } = useForm<SignupFormData>({
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

  const watchedFullName = watch('fullName');
  const watchedInstitution = watch('institution');
  const watchedPhone = watch('phone');
  // Placeholder for the OTP step (currently disabled).
  const smsCode = Array(6).fill('');

  const academicData = {
    course: 'A definir nas Definicoes',
    classroom: 'A definir nas Definicoes',
  };

  const handleNextStep = async () => {
    const stepFields =
      step === 1 ? ['studentId', 'fullName', 'email', 'institution'] as const :
      step === 3 ? ['phone'] as const :
      step === 5 ? ['password', 'confirmPassword'] as const :
      [] as const;

    const valid = stepFields.length ? await trigger(stepFields) : true;
    if (!valid) return;

    if (step === 5) {
      // Submit form
      setLoading(true);
      const form = document.getElementById('signup-form') as HTMLFormElement;
      form.requestSubmit();
      return;
    }

    setLoading(true);
    try {
      if (step === 3) {
        // OTP step temporarily disabled (skip SMS code step)
        if (!OTP_ENABLED) {
          setStep(5);
          return;
        }
      }
      if (step === 6) {
        router.push('/login');
        return;
      }
      setStep(step + 1);
    } finally {
      setLoading(false);
    }
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
                <label htmlFor="studentId" className="block text-sm font-semibold text-foreground mb-1.5 ml-1">ID Estudante</label>
                <input 
                  id="studentId"
                  placeholder="Ex: 2024..." 
                  {...register('studentId')}
                  className={inputClass}
                  aria-invalid={!!errors.studentId}
                />
                {errors.studentId && <p className="text-error text-xs mt-1 ml-1 font-medium">{errors.studentId.message}</p>}
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
                <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-1.5 ml-1">Email Institucional</label>
                <input 
                  id="email"
                  type="email"
                  placeholder="nome@instituicao.edu" 
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
                    error={errors.institution?.message as string}
                  />
                )}
              />
            </div>

            <button type="button" onClick={handleNextStep} className={buttonClass}>Continuar</button>
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
              <div className="flex justify-between border-b border-primary/10 pb-2">
                <span className="text-muted font-medium">Curso:</span>
                <span className="text-foreground font-bold">{academicData.course}</span>
              </div>
              <div className="flex justify-between border-b border-primary/10 pb-2">
                <span className="text-muted font-medium">Instituição:</span>
                <span className="text-foreground font-bold">{watchedInstitution ? watchedInstitution.replace(/-/g, ' ') : 'Não informada'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted font-medium">Turma:</span>
                <span className="text-foreground font-bold">{academicData.classroom}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className={secondaryButtonClass}>Voltar</button>
              <button type="button" onClick={handleNextStep} className="flex-2 bg-primary text-white py-3 rounded-xl font-bold hover:opacity-90 shadow-md">Sim, sou eu</button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-2xl font-extrabold text-foreground mb-1">Telemóvel</h2>
              <p className="text-muted text-sm mb-6">Precisamos validar o teu número via SMS</p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-foreground mb-1.5 ml-1">Número de Telemóvel</label>
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

            <button type="button" onClick={handleNextStep} className={buttonClass}>
              {OTP_ENABLED ? 'Receber Código' : 'Continuar'}
            </button>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-2xl font-extrabold text-foreground mb-1">Código SMS</h2>
              <p className="text-muted text-sm">Enviamos um código de 6 dígitos para {watchedPhone}</p>
            </div>

            <div className="flex justify-center gap-2">
              {smsCode.map((d, i) => (
                <input 
                  key={i} 
                  className="w-12 h-14 border-2 border-muted/20 rounded-xl text-center text-xl font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" 
                  maxLength={1} 
                  aria-label={`Dígito ${i+1} do código SMS`}
                />
              ))}
            </div>
            
            <div className="pt-2">
              <button type="button" onClick={handleNextStep} className={buttonClass}>Verificar</button>
              <button type="button" className="mt-4 text-sm text-primary font-bold hover:underline">Reenviar código</button>
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
                <input 
                  id="password"
                  type="password" 
                  placeholder="Min. 6 caracteres" 
                  {...register('password')}
                  className={inputClass}
                  aria-invalid={!!errors.password}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-foreground mb-1.5 ml-1">Confirmar Senha</label>
                <input 
                  id="confirmPassword"
                  type="password" 
                  placeholder="Repete a senha" 
                  {...register('confirmPassword')}
                  className={inputClass}
                  aria-invalid={!!errors.confirmPassword}
                />
              </div>
            </div>

            {errors.password && <p className="text-error text-sm font-medium">{errors.password.message}</p>}
            {errors.confirmPassword && <p className="text-error text-sm font-medium">{errors.confirmPassword.message}</p>}

            <button type="button" onClick={handleNextStep} className={buttonClass}>Criar Conta</button>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-foreground mb-1">Tudo Pronto!</h2>
              <p className="text-muted leading-relaxed">A tua conta Marketu foi criada com sucesso. Bem-vindo à comunidade!</p>
            </div>
            <button type="button" onClick={() => router.push('/home')} className={buttonClass}>Começar agora</button>
          </div>
        );
      default:
        return null;
    }
  };

  const progressSteps = OTP_ENABLED ? [1, 2, 3, 4, 5] : [1, 2, 3, 5];

  return (
    <form id="signup-form" action={signup} className="flex bg-surface rounded-3xl overflow-hidden shadow-2xl w-full max-w-4xl min-h-600px border border-muted/10">
      <div className="hidden md:flex md:w-1/2 bg-primary items-center justify-center p-12 text-white relative">
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
             <span className="text-3xl font-black">mU</span>
          </div>
          <h1 className="text-4xl font-black mb-4 tracking-tight">MarketU</h1>
          <p className="text-primary-foreground/80 leading-relaxed text-lg">O primeiro marketplace exclusivo para estudantes da tua instituição.</p>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-surface rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary-foreground rounded-full blur-3xl"></div>
        </div>
      </div>
      <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
        {step < 6 && (
          <div className="flex justify-between mb-10 px-2">
            {progressSteps.map(i => (
              <div key={i} className={`h-1.5 flex-1 mx-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-primary' : 'bg-muted/10'}`} />
            ))}
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
  );
};

export default Signup;
