import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import ErrorDialog from "../components/ErrorDialog";
import { useAuth } from '../components/AuthHandler';
import './SignInPage.css';

const SignInPage = () => {
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://sapitos-backend.cfapps.us10-001.hana.ondemand.com";
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  // OTP related states
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [otpSecret, setOtpSecret] = useState("");
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = Array(6).fill(0).map(_ => useRef(null));

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false);
    }
  }, [countdown, resendDisabled]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
      }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: email, contrasena: password }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        let message = "Error en el inicio de sesión";
        if (data.error === "Usuario no encontrado") {
          message = "El usuario no existe en el sistema";
        } else if (data.error === "Contraseña incorrecta") {
          message = "La contraseña ingresada es incorrecta";
        }
        setErrorMessage(message);
        setDialogOpen(true);
        throw new Error(data.error || message);
      }

      if (!data.usuario) {
        setErrorMessage("Datos de sesión incompletos");
        setDialogOpen(true);
        throw new Error("Datos de sesión incompletos");
      }

      // Verificar el dominio del correo
      const emailDomain = email.toLowerCase().split('@')[1];
      const allowedDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'tec.mx'];
      const requiresOtp = allowedDomains.includes(emailDomain);

      if (data.requiresOtp && requiresOtp) {
        const otpData = await generateOTP();
        if (otpData && otpData.secret) {
          setOtpSecret(otpData.secret);
        }
        setIsLoginMode(false);
      } else {
        window.location.href = '/dashboard';
      }

    } catch (error) {
      setError(error.message || "Error en el inicio de sesión");
    } finally {
      setIsLoading(false);
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

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);

    if (value && index < 5 && inputRefs[index + 1]?.current) {
      inputRefs[index + 1].current.focus();
    }

    if (newOtpValues.every(val => val) && newOtpValues.join('').length === 6) {
      setTimeout(() => {
        handleVerifyOtp(newOtpValues.join(''));
      }, 300);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0 && inputRefs[index - 1]?.current) {
      inputRefs[index - 1].current.focus();
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
    if (focusIndex >= 0 && inputRefs[focusIndex]?.current) {
      inputRefs[focusIndex].current.focus();
    }
    if (pasteData.length >= 6) {
      setTimeout(() => {
        handleVerifyOtp(pasteData.substring(0, 6));
      }, 300);
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
      }

      if (data.verified) {
        window.location.href = '/dashboard';
      } else {
        throw new Error("Código de verificación inválido");
      }
      
    } catch (error) {
      console.error("Error verificando OTP:", error);
      setError(error.message || "Error verificando código");
      
      setOtpValues(['', '', '', '', '', '']);
      if (inputRefs[0]?.current) inputRefs[0].current.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendDisabled) return;
    await generateOTP();
  };

  const handleReturnToSignIn = async () => {
    try {
      // Limpiar la sesión en el backend
      await fetch(`${API_BASE_URL}/users/logoutUser`, {
        method: "POST",
        credentials: "include",
      });

      // Resetear estados locales
      setOtpValues(['', '', '', '', '', '']);
      setOtpSecret("");
      setEmail("");
      setPassword("");
      setError("");
      setIsLoginMode(true);
      
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  if (isAuthenticated) {
    return (
      <section className='auth bg-base d-flex flex-wrap'>
        <div className='auth-right py-32 px-24 d-flex flex-column justify-content-center w-100'>
          <div className='max-w-464-px mx-auto w-100 text-center'>
            <Icon icon="mdi:loading" className="text-primary text-3xl animate-spin mb-3" />
            <p>Verificando sesión...</p>
          </div>
        </div>
      </section>
    );
  }



  return (
    <section className='auth d-flex align-items-center justify-content-center min-vh-100' style={{
      background: '#f5f5f5',
      position: 'relative'
    }}>
      <div className='container-slider' style={{
        width: '100vw',
        height: '100vh',
        background: 'white',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div className={`slider-content ${isLoginMode ? '' : 'right-panel-active'}`}>
          {/* Panel de Formularios */}
          <div className='forms-container'>
            <div className='signin-signup'>

              {/* FORMULARIO DE LOGIN */}
              <form onSubmit={handleLogin} className='sign-in-form needs-validation' noValidate>
                <div className="text-center" style={{ marginTop: '-1rem', marginBottom: '2rem' }}>
                  <img src="/assets/images/logo.png" alt="Logo" className="img-fluid" style={{ maxWidth: '220px' }} />
                </div>
                <div className="text-center mb-4">
                  <h2 className='mb-3' style={{ fontSize: '2.2rem', fontWeight: '600' }}>Iniciar sesión</h2>
                  <p className='mb-4 text-secondary-light' style={{ fontSize: '1.1rem' }}>
                    Por favor ingrese sus datos
                  </p>
                </div>

                <div className='icon-field mb-4.5' style={{ maxWidth: '500px', margin: '0 auto', width: '90%', marginBottom: '2rem' }}>
                  <span className='icon top-50 translate-middle-y'>
                    <Icon icon='mdi:email-outline' className='text-muted' />
                  </span>
                  <input
                    type='email'
                    id='username'
                    className='form-control h-56-px bg-neutral-50 radius-12'
                    placeholder='Correo electrónico'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete='email'
                  />
                </div>

                <div className='position-relative mb-4' style={{ maxWidth: '500px', margin: '0 auto', width: '90%' }}>
                  <div className='icon-field'>
                    <span className='icon top-50 translate-middle-y'>
                      <Icon icon='solar:lock-password-outline' className='text-muted' />
                    </span>
                    <input
                      type='password'
                      id='password'
                      className='form-control h-56-px bg-neutral-50 radius-12'
                      placeholder='Contraseña'
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete='current-password'
                    />
                  </div>
                </div>

                {/* BOTÓN LOGIN CON MARGEN SUPERIOR */}
                <div className='d-grid gap-3 mt-4.5' style={{ maxWidth: '500px', margin: '0 auto', width: '90%', marginTop: '2rem' }}>
                  <button
                    id='loginButton'
                    type='submit'
                    className='btn btn-primary h-56-px'
                    disabled={isLoading}
                  >
                    {isLoading ? 'Procesando...' : 'Iniciar sesión'}
                  </button>
                </div>
              </form>

              {/* FORMULARIO DE VERIFICACIÓN OTP */}
              <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }} className='sign-up-form' style={{ position: 'relative' }}>
                <div className="text-center" style={{ 
                  marginTop: '2rem', 
                  marginBottom: '2rem', 
                  position: 'relative',
                  zIndex: '9999',
                  backgroundColor: 'white'
                }}>
                  <img 
                    src="/assets/images/logo.png" 
                    alt="Logo" 
                    className="img-fluid" 
                    style={{ 
                      maxWidth: '220px', 
                      position: 'relative', 
                      zIndex: '9999',
                      display: 'block',
                      margin: '0 auto'
                    }} 
                  />
                </div>
                <div className="text-center mb-4">
                  <h2 className='mb-3' style={{ fontSize: '2.2rem', fontWeight: '600' }}>Verificación de seguridad</h2>
                  <p className='mb-4 text-secondary-light' style={{ fontSize: '1.1rem' }}>
                    Hemos enviado un código de verificación a tu correo electrónico.
                    Por favor, ingresa el código para continuar.
                  </p>
                </div>

                <div className='mb-4 mt-2'>
                  <label className='form-label mb-3'>Código de verificación</label>
                  <div className="d-flex justify-content-center gap-2 mb-3">
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
                        ref={inputRefs[index]}
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        inputMode="numeric"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                </div>
                
                <div className='d-grid gap-3 mt-3'>
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

                  <div className="text-center mt-4">
                    <button 
                      type="button" 
                      className="btn btn-outline-danger"
                      onClick={handleReturnToSignIn}
                      style={{
                        padding: '0.75rem 2rem',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        borderColor: '#dc3545',
                        color: '#dc3545',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <Icon icon="mdi:arrow-left" className="me-2" />
                      Regresar
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

          {/* PANEL IZQUIERDO CON IMAGEN GRANDE Y CENTRADA */}
          <div className='panels-container'>
            <div className='panel left-panel d-flex align-items-center justify-content-center'>
              <img
                src='assets/images/auth/auth-img.png'
                className='image left-image'
                alt='Imagen'
                style={{
                  width: '120%',
                  height: 'auto',
                  transform: 'scale(1.2)',
                  objectFit: 'contain',
                  transition: 'opacity 0.5s ease-in-out'
                }}
              />
            </div>
            <div className='panel right-panel'>
              <img src='assets/images/auth/auth-img2.png' className='image' alt='' />
            </div>
          </div>
        </div>
      </div>

      <ErrorDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        errorMessage={errorMessage}
      />
    </section>
  );
};


export default SignInPage;
