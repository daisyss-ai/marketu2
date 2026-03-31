import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Recover = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [recoveryMethod, setRecoveryMethod] = useState(null); // 'phone' or 'email'

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
  const [errors, setErrors] = useState({});

  const validateStep = (stepNumber) => {
    const newErrors = {};

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
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(newPassword)) {
        newErrors.newPassword = 'Palavra-passe deve conter maiúsculas, minúsculas, números e caracteres especiais';
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
      if (step === 1) {
        // Step 1 to 2: Method selected
        await new Promise((resolve) => setTimeout(resolve, 600));
      } else if (step === 2) {
        // Step 2 to 3: Send code
        await new Promise((resolve) => setTimeout(resolve, 800));
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
      } else if (step === 3) {
        // Step 3 to 4: Verify code
        await new Promise((resolve) => setTimeout(resolve, 800));
      } else if (step === 4) {
        // Step 4: Complete recovery
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

      if (value && index < 5) {
        document.getElementById(`smsCode-${index + 1}`)?.focus();
      }

      // Auto-verify when all 6 digits are filled
      if (newCode.join('').length === 6 && newCode.every(digit => digit !== '')) {
        setTimeout(async () => {
          setLoading(true);
          try {
            await new Promise((resolve) => setTimeout(resolve, 600));
            setStep(4);
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

  // Step 1: Choose Recovery Method
  const renderStep1 = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Recuperar Conta</h1>
      <p className="text-gray-600 mb-8">Vamos ajudar-te a recuperar o acesso</p>

      <div className="space-y-3">
        <button
          onClick={() => {
            setRecoveryMethod('phone');
            setStep(2);
            setErrors({});
          }}
          className="w-full bg-purple-600 text-white font-semibold py-3 rounded hover:bg-purple-700 transition-colors"
        >
          Usar Número de Telemóvel
        </button>

        <button
          onClick={() => {
            setRecoveryMethod('email');
            setStep(2);
            setErrors({});
          }}
          className="w-full bg-white border-2 border-purple-600 text-purple-600 font-semibold py-3 rounded hover:bg-purple-50 transition-colors"
        >
          Usar Email
        </button>
      </div>
    </div>
  );

  // Step 2: Phone or Email
  const renderStep2 = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Recuperar Conta</h1>
      <p className="text-gray-600 mb-8">Vamos ajudar-te a recuperar o acesso</p>

      {recoveryMethod === 'phone' ? (
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
          <p className="text-purple-600 text-xs mt-1">Vamos enviar um código de recuperação</p>
          {errors.phone && (
            <p className="text-red-600 text-xs mt-1">{errors.phone}</p>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-gray-800 text-sm font-semibold mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
            className={`w-full px-4 py-3 rounded border-0 focus:outline-none focus:ring-2 ${
              errors.email
                ? 'bg-red-100 focus:ring-red-500'
                : 'bg-purple-100 focus:ring-purple-400'
            }`}
            placeholder="seu@email.com"
          />
          <p className="text-purple-600 text-xs mt-1">Vamos enviar um código de recuperação</p>
          {errors.email && (
            <p className="text-red-600 text-xs mt-1">{errors.email}</p>
          )}
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
          {loading ? 'Enviando...' : 'Receber'}
        </button>
      </div>
    </div>
  );

  // Step 3: SMS Code
  const renderStep3 = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Código SMS</h1>
      <p className="text-gray-600 mb-8">Digite o código enviado para {recoveryMethod === 'phone' ? phone : email}</p>

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

  // Step 4: New Password
  const renderStep4 = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Criar Nova Palavra-passe</h1>
      <p className="text-gray-600 mb-8"></p>

      <div>
        <label className="block text-gray-800 text-sm font-semibold mb-2">
          Palavra-passe
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (errors.newPassword) setErrors({ ...errors, newPassword: '' });
            }}
            className={`w-full px-4 py-3 pr-12 rounded border-0 focus:outline-none focus:ring-2 ${
              errors.newPassword
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
        {errors.newPassword && (
          <p className="text-red-600 text-xs mt-1">{errors.newPassword}</p>
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
        {confirmPassword && newPassword === confirmPassword && (
          <p className="text-green-600 text-xs mt-1">✓ As palavras-passe coincidem</p>
        )}
        {errors.confirmPassword && (
          <p className="text-red-600 text-xs mt-1">{errors.confirmPassword}</p>
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
          onClick={() => {
            const newErrors = validateStep(step);
            if (Object.keys(newErrors).length === 0) {
              navigate('/login');
            } else {
              setErrors(newErrors);
            }
          }}
          disabled={loading}
          className="flex-1 bg-purple-600 text-white font-semibold py-3 rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Guardando...' : 'Confirmar'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Purple */}
      <div className="hidden md:flex md:w-1/2 bg-purple-600 items-center justify-center p-8 relative">
        <div className="absolute top-8 left-8 w-20 h-20 bg-white rounded-full"></div>
      </div>

      {/* Right Side - White/Light Gray */}
      <div className="w-full md:w-1/2 bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="md:hidden mb-8 flex justify-start">
            <div className="w-16 h-16 bg-purple-600 rounded-full"></div>
          </div>

          {/* Step Content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}

          {/* Divider */}
          {step < 4 && <div className="my-6 border-t border-gray-300"></div>}

          {/* Footer Message */}
          {step < 4 && (
            <div className="text-center space-y-2">
              <p className="text-gray-600 text-xs">
                Os teus dados estão seguros e nunca serão partilhados.
                <br />
                <button
                  onClick={() => navigate('/login')}
                  className="text-purple-600 hover:underline font-semibold cursor-pointer"
                >
                  Voltar ao login
                </button>
              </p>
            </div>
          )}

          {/* Success Footer */}
          {step === 4 && (
            <div className="mt-8 text-center">
              <p className="text-gray-600 text-xs">
                Os teus dados estão seguros e nunca serão partilhados.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recover;
