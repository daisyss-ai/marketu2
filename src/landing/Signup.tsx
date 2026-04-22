'use client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';

interface SignupProps {
  onFlipToLogin?: () => void;
  onSlideToLogin?: () => void;
}

const Signup = ({ onFlipToLogin, onSlideToLogin }: SignupProps) => {
  const handleSwitch = onFlipToLogin || onSlideToLogin;
  const router = useRouter();
  const { login, setError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    student_id: '',
    first_name: '',
    last_name: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.student_id.trim()) {
      newErrors.student_id = 'ID de Estudante é obrigatório';
    } else if (!/^[0-9]{5}$/.test(formData.student_id)) {
      newErrors.student_id = 'ID de Estudante deve conter exatamente 5 números';
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Nome é obrigatório';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Sobrenome é obrigatório';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Palavra-passe é obrigatória';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Palavra-passe deve ter pelo menos 8 caracteres';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Deve conter pelo menos uma letra maiúscula';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Deve conter pelo menos um número';
    } else if (!/[!@#$%^&*]/.test(formData.password)) {
      newErrors.password = 'Deve conter pelo menos um caractere especial (!@#$%^&*)';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Palavras-passe não correspondem';
    }

    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // For student_id, only allow numbers
    let finalValue = value;
    if (name === 'student_id') {
      finalValue = value.replace(/[^0-9]/g, '').slice(0, 5); // Only numbers, max 5
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
    if (errors[name]) {
      setErrors((prev: any) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar conta');
      }

      const data = await response.json();
      setSuccess('Conta criada com sucesso! Verifique o seu email para continuar.');
      
      // Extract user data from API response
      const userData = {
        id: data.data.user.id,
        email: data.data.user.email,
        studentId: data.data.user.student_id,
        firstName: data.data.user.first_name,
        lastName: data.data.user.last_name,
        studentIdVerified: data.data.user.student_id_verified,
      };
      
      // Store user info
      login(userData);
      
      // Navigate to verification page
      setTimeout(() => router.push('/verify-email'), 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar conta. Tente novamente.';
      setErrors({ submit: errorMessage });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-muted/20 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all bg-surface text-foreground placeholder:text-muted/50";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 p-4">
      <div className="w-full max-w-md">
        <div className="space-y-4 bg-surface rounded-2xl p-8 shadow-lg border border-muted/10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h2 className="text-2xl font-extrabold text-foreground mb-1">Criar Conta</h2>
              <p className="text-muted text-sm mb-6">Regista-te como estudante em MarketU</p>
            </div>

            {success && (
              <div className="p-3 bg-green-100 text-green-700 rounded text-sm">
                {success}
              </div>
            )}

            {errors.submit && (
              <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
                {errors.submit}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-semibold text-foreground mb-1.5 ml-1">
                  Nome
                </label>
                <input 
                  id="first_name"
                  name="first_name"
                  type="text"
                  placeholder="Teu nome"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={inputClass}
                  aria-invalid={!!errors.first_name}
                />
                {errors.first_name && <p className="text-error text-xs mt-1 ml-1 font-medium">{errors.first_name}</p>}
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-semibold text-foreground mb-1.5 ml-1">
                  Sobrenome
                </label>
                <input 
                  id="last_name"
                  name="last_name"
                  type="text"
                  placeholder="Teu sobrenome"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={inputClass}
                  aria-invalid={!!errors.last_name}
                />
                {errors.last_name && <p className="text-error text-xs mt-1 ml-1 font-medium">{errors.last_name}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="student_id" className="block text-sm font-semibold text-foreground mb-1.5 ml-1">
                ID de Estudante (5 dígitos)
              </label>
              <input 
                id="student_id"
                name="student_id"
                type="text"
                inputMode="numeric"
                placeholder="Ex: 20240"
                maxLength={5}
                value={formData.student_id}
                onChange={handleChange}
                className={inputClass}
                aria-invalid={!!errors.student_id}
              />
              {errors.student_id && <p className="text-error text-xs mt-1 ml-1 font-medium">{errors.student_id}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-1.5 ml-1">
                Email
              </label>
              <input 
                id="email"
                name="email"
                type="email"
                placeholder="teu@email.com"
                value={formData.email}
                onChange={handleChange}
                className={inputClass}
                aria-invalid={!!errors.email}
              />
              {errors.email && <p className="text-error text-xs mt-1 ml-1 font-medium">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-1.5 ml-1">
                Palavra-passe
              </label>
              <div className="relative">
                <input 
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 caracteres, 1 maiúscula, 1 número, 1 símbolo"
                  value={formData.password}
                  onChange={handleChange}
                  className={inputClass}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-primary hover:text-primary/80 transition-colors"
                  aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <p className="text-error text-xs mt-1 ml-1 font-medium">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-foreground mb-1.5 ml-1">
                Confirmar Palavra-passe
              </label>
              <input 
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Repete a palavra-passe"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={inputClass}
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && <p className="text-error text-xs mt-1 ml-1 font-medium">{errors.confirmPassword}</p>}
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3.5 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-md active:scale-[0.98] focus:ring-4 focus:ring-primary/30"
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </form>

          <p className="text-center text-sm text-muted">
            Já tens conta?{' '}
            <button
              onClick={handleSwitch}
              className="font-bold text-primary hover:text-primary/80 transition-colors"
            >
              Entra aqui
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;