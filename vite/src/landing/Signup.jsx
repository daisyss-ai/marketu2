import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const navigate = useNavigate();
  // Multi-step form state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Basic Info
  const [studentId, setStudentId] = useState('');
  const [fullName, setFullName] = useState('');

  // Step 2: Identity Confirmation - Mock academic data
  const [academicData] = useState({
    processNumber: '68722',
    areaOfTraining: 'Informática',
    course: 'Técnico de Informática',
    class: '13ª classe',
    shift: 'Tarde',
    classroom: 'III3A',
    number: '52'
  });

  // Step 3: Phone Verification
  const [phone, setPhone] = useState('');

  // Step 4: SMS Code
  const [smsCode, setSmsCode] = useState(Array(6).fill(''));
  const [codeRequested, setCodeRequested] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Step 5: Password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Error states
  const [errors, setErrors] = useState({});

  // Validation functions
  const validateStep = (stepNumber) => {
    const newErrors = {};

    if (stepNumber === 1) {
      if (!studentId.trim()) {
        newErrors.studentId = 'ID de Estudante é obrigatório';
      } else if (studentId.trim().length < 3) {
        newErrors.studentId = 'Por favor, introduza um ID válido';
      }

      if (!fullName.trim()) {
        newErrors.fullName = 'Nome Completo é obrigatório';
      } else if (fullName.trim().length < 5) {
        newErrors.fullName = 'Por favor, introduza o seu nome completo';
      }
    } else if (stepNumber === 3) {
      if (!phone.trim()) {
        newErrors.phone = 'Número de telemóvel é obrigatório';
      } else if (!/^\+?[0-9]{9,}$/.test(phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Por favor, introduza um número de telemóvel válido';
      }
    } else if (stepNumber === 4) {
      const code = smsCode.join('');
      if (code.length !== 6) {
        newErrors.smsCode = 'Por favor, introduza todos os 6 dígitos';
      } else if (!/^\d{6}$/.test(code)) {
        newErrors.smsCode = 'Código deve conter apenas números';
      }
    } else if (stepNumber === 5) {
      if (!password.trim()) {
        newErrors.password = 'Palavra-passe é obrigatória';
      } else if (password.length < 8) {
        newErrors.password = 'Palavra-passe deve ter no mínimo 8 caracteres';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
        newErrors.password = 'Palavra-passe deve conter maiúsculas, minúsculas, números e caracteres especiais';
      }

      if (!confirmPassword.trim()) {
        newErrors.confirmPassword = 'Confirmação de palavra-passe é obrigatória';
      } else if (password !== confirmPassword) {
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
      // Simulate API call for phone verification (step 3)
      if (step === 3) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        // Request code automatically when moving to step 4
        setCodeRequested(true);
        setCanResend(false);
        setCountdown(50);

        // Start countdown
        const interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              setCanResend(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
      // Simulate API call for SMS code verification (step 4)
      if (step === 4) {
        await new Promise((resolve) => setTimeout(resolve, 800));
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

  const handleSmsCodeChange = (index, value) => {
    if (/^\d?$/.test(value)) {
      const newCode = [...smsCode];
      newCode[index] = value;
      setSmsCode(newCode);
      
      // Auto-focus to next input
      if (value && index < 5) {
        document.getElementById(`smsCode-${index + 1}`)?.focus();
      }

      // Auto-verify when all 6 digits are filled
      if (newCode.join('').length === 6 && newCode.every(digit => digit !== '')) {
        // Simulate verification and move to step 5 (Create Password)
        setTimeout(async () => {
          setLoading(true);
          try {
            await new Promise((resolve) => setTimeout(resolve, 600));
            setStep(5);
            setErrors({});
          } catch (error) {
            setErrors({ smsCode: 'Erro ao verificar código.' });
          } finally {
            setLoading(false);
          }
        }, 300);
      }
    }
  };

  const handleRequestCode = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setCodeRequested(true);
      setCanResend(false);
      setCountdown(50);
      setErrors({});

      // Start countdown
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      setErrors({ submit: 'Erro ao solicitar código. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const calculatePasswordStrength = (pwd) => {
    let strength = 0;
    
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[@$!%*?&]/.test(pwd)) strength++;

    if (strength <= 2) {
      return { color: '#EF4444', percentage: 25, label: 'Fraca' };
    } else if (strength <= 4) {
      return { color: '#F59E0B', percentage: 50, label: 'Média' };
    } else {
      return { color: '#10B981', percentage: 100, label: 'Forte' };
    }
  };

  // Step 1: Create Account
  const renderStep1 = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Criar Conta</h1>
      <p className="text-gray-600 mb-8">Valida a tua Identidade para continuar</p>

      <div>
        <label className="block text-gray-800 text-sm font-semibold mb-2">
          ID de Estudante / Nº de Processo
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
              : 'bg-purple-100 focus:ring-purple-400'
          }`}
          placeholder="Ex: 20240"
        />
        <p className="text-purple-600 text-xs mt-1">O teu nº de processo registado na escola</p>
        {errors.studentId && (
          <p className="text-red-600 text-xs mt-1">{errors.studentId}</p>
        )}
      </div>

      <div>
        <label className="block text-gray-800 text-sm font-semibold mb-2">
          Nome Completo
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            if (errors.fullName) setErrors({ ...errors, fullName: '' });
          }}
          className={`w-full px-4 py-3 rounded border-0 focus:outline-none focus:ring-2 ${
            errors.fullName
              ? 'bg-red-100 focus:ring-red-500'
              : 'bg-purple-100 focus:ring-purple-400'
          }`}
          placeholder="Ex: João Manuel da Silva Santos"
        />
        <p className="text-purple-600 text-xs mt-1">Use o nome EXATO registado na escola</p>
        {errors.fullName && (
          <p className="text-red-600 text-xs mt-1">{errors.fullName}</p>
        )}
      </div>

      <button
        onClick={handleNextStep}
        disabled={loading}
        className="w-full bg-purple-600 text-white font-semibold py-3 rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Verificando...' : 'Verificar os meus dados'}
      </button>
    </div>
  );

  // Step 2: Confirm Identity
  const renderStep2 = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Confirme a sua Identidade</h1>
      <p className="text-gray-600 mb-8">Confirme se os dados estão corretos</p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">{fullName}</h3>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Nº de Processo:</p>
            <p className="font-semibold text-gray-900">{academicData.processNumber}</p>
          </div>
          <div>
            <p className="text-gray-600">Área de Formação:</p>
            <p className="font-semibold text-gray-900">{academicData.areaOfTraining}</p>
          </div>
          <div>
            <p className="text-gray-600">Curso:</p>
            <p className="font-semibold text-gray-900">{academicData.course}</p>
          </div>
          <div>
            <p className="text-gray-600">Classe:</p>
            <p className="font-semibold text-gray-900">{academicData.class}</p>
          </div>
          <div>
            <p className="text-gray-600">Turno:</p>
            <p className="font-semibold text-gray-900">{academicData.shift}</p>
          </div>
          <div>
            <p className="text-gray-600">Turma:</p>
            <p className="font-semibold text-gray-900">{academicData.classroom}</p>
          </div>
          <div>
            <p className="text-gray-600">Número:</p>
            <p className="font-semibold text-gray-900">{academicData.number}</p>
          </div>
        </div>
      </div>

      {errors.submit && (
        <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
          {errors.submit}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handlePrevStep}
          className="flex-1 bg-white border-2 border-purple-600 text-purple-600 font-semibold py-3 rounded hover:bg-purple-50 transition-colors"
        >
          Não, tente novamente
        </button>
        <button
          onClick={handleNextStep}
          disabled={loading}
          className="flex-1 bg-purple-600 text-white font-semibold py-3 rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Continuando...' : 'Sim, continuar'}
        </button>
      </div>
    </div>
  );

  // Step 3: Phone Verification
  const renderStep3 = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Verificar Telemóvel</h1>
      <p className="text-gray-600 mb-8">Vamos enviar um código SMS para confirmação</p>

      <div>
        <label className="block text-gray-800 text-sm font-semibold mb-2">
          Número de Telemóvel
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (errors.phone) setErrors({ ...errors, phone: '' });
          }}
          className={`w-full px-4 py-3 rounded border-0 focus:outline-none focus:ring-2 ${
            errors.phone
              ? 'bg-red-100 focus:ring-red-500'
              : 'bg-purple-100 focus:ring-purple-400'
          }`}
          placeholder="+244 9XX XXX XXX"
        />
        <p className="text-purple-600 text-xs mt-1">Vais receber um código de 6 dígitos</p>
        {errors.phone && (
          <p className="text-red-600 text-xs mt-1">{errors.phone}</p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handlePrevStep}
          className="flex-1 bg-white border-2 border-purple-600 text-purple-600 font-semibold py-3 rounded hover:bg-purple-50 transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={handleNextStep}
          disabled={loading}
          className="flex-1 bg-purple-600 text-white font-semibold py-3 rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Enviando...' : 'Receber Código'}
        </button>
      </div>
    </div>
  );

  // Step 4: SMS Code
  const renderStep4 = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Código SMS</h1>
      <p className="text-gray-600 mb-8">Digite o código enviado para {phone}</p>

      {!codeRequested ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Nenhum código foi solicitado ainda.</p>
          <button
            onClick={handleRequestCode}
            disabled={loading}
            className="text-purple-600 hover:underline font-semibold disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'A enviar...' : 'Receber código'}
          </button>
        </div>
      ) : (
        <>
          <div>
            <div className="flex gap-3 justify-center mb-6">
              {smsCode.map((digit, index) => (
                <input
                  key={index}
                  id={`smsCode-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleSmsCodeChange(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !digit && index > 0) {
                      document.getElementById(`smsCode-${index - 1}`)?.focus();
                    }
                  }}
                  className={`w-12 h-12 text-center text-xl font-semibold rounded border-2 focus:outline-none transition-colors ${
                    smsCode[index]
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-300 bg-white hover:border-purple-400'
                  }`}
                />
              ))}
            </div>
            
            <p className="text-center text-gray-600 text-sm">
              {canResend ? (
                <>
                  <button
                    onClick={handleRequestCode}
                    disabled={loading}
                    className="text-purple-600 hover:underline font-semibold disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    Reenviar código
                  </button>
                </>
              ) : countdown > 0 ? (
                <>
                  Reenviar código em <span className="font-semibold text-purple-600">{countdown}s</span>
                </>
              ) : null}
            </p>

            {errors.smsCode && (
              <p className="text-red-600 text-sm mt-2 text-center">{errors.smsCode}</p>
            )}
          </div>

          <div>
            <button
              onClick={handlePrevStep}
              className="w-full bg-white border-2 border-purple-600 text-purple-600 font-semibold py-3 rounded hover:bg-purple-50 transition-colors"
            >
              Voltar
            </button>
          </div>
        </>
      )}
    </div>
  );

  // Step 5: Create Password
  const renderStep5 = () => {
    const passwordStrength = calculatePasswordStrength(password);
    return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Criar Palavra-passe</h1>
      <p className="text-gray-600 mb-8"></p>

      <div>
        <label className="block text-gray-800 text-sm font-semibold mb-2">
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
                : 'bg-purple-100 focus:ring-purple-400'
            }`}
            placeholder="Palavra-passe forte"
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
        
        {/* Progress Bar */}
        <div className="mt-2 h-1 bg-gray-200 rounded overflow-hidden">
          <div
            style={{
              width: `${passwordStrength.percentage}%`,
              backgroundColor: passwordStrength.color,
              transition: 'width 0.3s ease'
            }}
            className="h-full"
          />
        </div>
        <p className="text-xs mt-1" style={{ color: passwordStrength.color }}>
          {password ? passwordStrength.label : ''}
        </p>
        
        {errors.password && (
          <p className="text-red-600 text-xs mt-1">{errors.password}</p>
        )}
      </div>

      <div>
        <label className="block text-gray-800 text-sm font-semibold mb-2">
          Confirmar Palavra-passe
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
            }}
            className={`w-full px-4 py-3 pr-12 rounded border-0 focus:outline-none focus:ring-2 ${
              errors.confirmPassword
                ? 'bg-red-100 focus:ring-red-500'
                : 'bg-purple-100 focus:ring-purple-400'
            }`}
            placeholder="Confirme a palavra-passe"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-3 text-gray-600 hover:text-gray-800"
            title={showConfirmPassword ? 'Mascarar' : 'Desmascarar'}
          >
            {showConfirmPassword ? (
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
        {confirmPassword && password === confirmPassword && (
          <p className="text-green-600 text-xs mt-1">✓ As palavras-passe coincidem</p>
        )}
        {errors.confirmPassword && (
          <p className="text-red-600 text-xs mt-1">{errors.confirmPassword}</p>
        )}
      </div>

      <div>
        <label className="block text-gray-800 text-sm font-semibold mb-2">
          Email (Opcional)
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded border-0 focus:outline-none focus:ring-2 bg-purple-100 focus:ring-purple-400"
          placeholder="seuemail@gmail.com"
        />
        <p className="text-purple-600 text-xs mt-1">Para recuperação de conta</p>
      </div>

      <div className="space-y-2">
        <label className="flex items-start">
          <input
            type="checkbox"
            className="w-5 h-5 rounded accent-purple-600 mt-1"
          />
          <span className="ml-3 text-gray-700 text-sm">
            Li e concordo com os <a href="#" className="text-purple-600 hover:underline">Termos de Uso e Política de Privacidade</a> do Marketu
          </span>
        </label>
        
        <label className="flex items-start">
          <input
            type="checkbox"
            className="w-5 h-5 rounded accent-purple-600 mt-1"
          />
          <span className="ml-3 text-gray-700 text-sm">
            Quero receber ofertas exclusivas, novidades e dicas sobre como vender melhor no Marketu
          </span>
        </label>
      </div>

      {errors.submit && (
        <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
          {errors.submit}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handlePrevStep}
          className="flex-1 bg-white border-2 border-purple-600 text-purple-600 font-semibold py-3 rounded hover:bg-purple-50 transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={handleNextStep}
          disabled={loading}
          className="flex-1 bg-purple-600 text-white font-semibold py-3 rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Criando...' : 'Criar minha conta'}
        </button>
      </div>
    </div>
    );
  };

  // Step 6: Account Created
  const renderStep6 = () => (
    <div className="space-y-6 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Conta Criada!</h1>
      <p className="text-gray-600 mb-8">Bem vindo ao Marketu {fullName}!</p>

      <div className="bg-green-50 border-2 border-green-400 rounded-lg p-6">
        <div className="mb-4">
          <svg className="w-16 h-16 mx-auto text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-green-700 font-semibold mb-2">A tua conta foi criada com sucesso! Agora podes</p>
        <p className="text-green-600 text-sm">começar a explorar e fazer negócios com outros estudantes.</p>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 space-y-2">
        <p className="font-semibold text-gray-900">Benefícios de Membro Fundador desbloqueados</p>
        <ul className="text-gray-700 text-sm space-y-1">
          <li>✓ Badge exclusivo no perfil</li>
          <li>✓ Acesso prioritário a novas funcionalidades</li>
          <li>✓ Suporte VIP por 3 meses</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => navigate('/login')}
          className="w-full bg-purple-600 text-white font-semibold py-3 rounded hover:bg-purple-700 transition-colors"
        >
          Entrar
        </button>
      </div>

      <p className="text-gray-600 text-xs">
        Os teus dados estão seguros e nunca serão partilhados.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Purple Card with rounded corners */}
      <div className="hidden md:flex md:w-1/2 bg-purple-600 items-center justify-center p-8 relative">
        <div className="absolute top-8 left-8 w-20 h-20 bg-white rounded-full"></div>
      </div>

      {/* Right Side - White/Light Gray */}
      <div className="w-full md:w-1/2 bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo - Visible on mobile only */}
          <div className="md:hidden mb-8 flex justify-start">
            <div className="w-16 h-16 bg-purple-600 rounded-full"></div>
          </div>

          {/* Step Indicator */}
          {step < 6 && (
            <div className="mb-8 flex justify-between text-xs text-gray-600">
              {[1, 2, 3, 4, 5].map((num) => (
                <div key={num} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      step >= num
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {num}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step Content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
          {step === 6 && renderStep6()}

          {/* Divider */}
          {step < 6 && <div className="my-6 border-t border-gray-300"></div>}

          {/* Footer Message */}
          {step < 6 && (
            <div className="text-center space-y-2">
              <p className="text-gray-600 text-xs">
                Os teus dados estão seguros e nunca serão partilhados.
                <br />
                Já tens conta?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-purple-600 hover:underline font-semibold cursor-pointer"
                >
                  Entrar aqui
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
