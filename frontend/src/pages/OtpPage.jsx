import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";

const OtpPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [otpSecret, setOtpSecret] = useState("");
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://sapitos-backend.cfapps.us10-001.hana.ondemand.com";
  
  const inputRefs = Array(6).fill(0).map(_ => useState(null)[0]);

  useEffect(() => {
    const storedSecret = sessionStorage.getItem('otpSecret');
    if (storedSecret) {
      setOtpSecret(storedSecret);
    } else {
      generateOTP();
    }
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false);
    }
  }, [countdown, resendDisabled]);  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);

    if (value && index < 5) {
      inputRefs[index + 1].focus();
    }

    if (newOtpValues.every(val => val) && newOtpValues.join('').length === 6) {
      setTimeout(() => {
        handleVerifyOtp(newOtpValues.join(''));
      }, 300); // Pequeño retraso para mejor UX
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (!/^\d+$/.test(pasteData)) return; 

    const newOtpValues = [...otpValues];
    for (let i = 0; i < Math.min(pasteData.length, 6); i++) {
      newOtpValues[i] = pasteData[i];
    }
    setOtpValues(newOtpValues);

    const focusIndex = Math.min(pasteData.length, 6) - 1;
    if (focusIndex >= 0) {
      inputRefs[focusIndex].focus();
    }
    if (pasteData.length >= 6) {
      setTimeout(() => {
        handleVerifyOtp(pasteData.substring(0, 6));
      }, 300);
    }
  };

  const generateOTP = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/otp/generate`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("No se pudo generar el código de verificación");
      }

      const data = await response.json();
      
      if (data.secret) {
        setOtpSecret(data.secret);
        sessionStorage.setItem('otpSecret', data.secret);
      }
      
      setResendDisabled(true);
      setCountdown(60);
      
      return data;
    } catch (error) {
      console.error("Error al generar OTP:", error);
      setError(error.message || "Error al generar el código de verificación");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (code = null) => {
    const otpCode = code || otpValues.join('');
    
    if (!otpCode || otpCode.length !== 6) {
      setError("Por favor ingresa los 6 dígitos del código");
      return;
    }

    if (!otpSecret) {
      setError("No se encontró información de verificación. Intenta generar un nuevo código.");
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          otp: otpCode, 
          secret: otpSecret 
        }),
        credentials: "include",
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Error verificando código");
      }      if (data.verified) {
        sessionStorage.removeItem('otpSecret');
        
        // Check if we have a saved return URL
        const returnUrl = sessionStorage.getItem('returnUrl');
        sessionStorage.removeItem('returnUrl');
        
        setTimeout(() => {
          // Redirect to saved URL or dashboard as fallback
          navigate(returnUrl || "/dashboard");
        }, 500);
      } else {
        throw new Error("Código de verificación inválido");
      }
      
    } catch (error) {
      console.error("Error verificando OTP:", error);
      setError(error.message || "Error verificando código");
      
      setOtpValues(['', '', '', '', '', '']);
      if (inputRefs[0]) inputRefs[0].focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleVerifyOtp();
  };

  const handleResendCode = async () => {
    if (resendDisabled) return;
    await generateOTP();
  };

  return (
    <section className='auth bg-base d-flex flex-wrap'>      <div className='auth-left d-lg-block d-none'>
        <div className='d-flex align-items-center flex-column h-100 justify-content-center'>
          <img src='/assets/images/Sapitos, Deep in Thought.png' alt='Logo' className='img-fluid' />
        </div>
      </div>
      <div className='auth-right py-32 px-24 d-flex flex-column justify-content-center'>
        <div className='max-w-464-px mx-auto w-100'>
          <div>
            <Link to='/' className='mb-40 max-w-290-px d-block'>
              <img src='/assets/images/logo.png' alt='Logo' className='img-fluid' />
            </Link>            <div className='mb-32'>
              <h1 className='h2 text-header mb-8'>Verificación de seguridad</h1>
              <p className='text-muted'>
                Hemos enviado un código de verificación a tu correo electrónico.
                Por favor, ingresa el código para continuar.
              </p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className='mb-24'>
                <label className='form-label mb-16'>Código de verificación</label>                <div className="d-flex justify-content-center gap-2 mb-3">
                  {otpValues.map((value, index) => (
                    <input
                      key={index}
                      type="text"
                      className="form-control text-center h-56-px bg-neutral-50 radius-12"
                      style={{ 
                        width: '50px', 
                        fontSize: '2rem', 
                        fontWeight: 'bold',
                        padding: '0.25rem 0'
                      }}
                      value={value}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      maxLength={1}
                      ref={el => inputRefs[index] = el}
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      inputMode="numeric"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              </div>
              
              <div className='d-grid gap-3'>
                <button 
                  type='submit'
                  className='btn btn-primary h-48-px d-flex align-items-center justify-content-center radius-12'
                  disabled={isLoading || otpValues.some(val => !val)}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <Icon icon="solar:shield-check-bold" className="me-2" />
                      <span>Verificar código</span>
                    </>
                  )}
                </button>
                
                <div className="text-center mt-3">
                  <button 
                    type="button" 
                    className="btn btn-link text-decoration-none" 
                    onClick={handleResendCode}
                    disabled={resendDisabled}
                  >
                    {resendDisabled ? `Reenviar código (${countdown}s)` : 'Reenviar código'}
                  </button>
                </div>

                {error && (
                  <div className="alert alert-danger d-flex align-items-center p-3 mb-0">
                    <Icon icon="mdi:alert-circle" className="me-2 flex-shrink-0 text-danger" />
                    <div className="text-sm">{error}</div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OtpPage;