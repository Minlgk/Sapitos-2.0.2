import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import ErrorDialog from "../components/ErrorDialog";
import { useAuth } from '../components/AuthHandler';
import './SignInPage.css';
import { API_BASE_URL, fetchConfig } from '../config';
import { setCookie, removeCookie } from '../utils/cookies';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SignInPage = () => {
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!email || !password) {
      setErrorMessage("Por favor ingresa tu correo y contraseña");
      setDialogOpen(true);
      setIsLoading(false);
      return;
    }

    try {
      console.log(`Attempting login to ${API_BASE_URL}/users/login`);
      
      // Marcar que el login está en progreso
      sessionStorage.setItem('loginInProgress', 'true');
      
      // Limpiar cualquier sesión anterior
      sessionStorage.removeItem('sessionValidated');
      
      console.log('Enviando solicitud de login al servidor');
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        ...fetchConfig,
        body: JSON.stringify({
          correo: email,
          contrasena: password
        }),
      });

      console.log("Login response status:", response.status);
      const data = await response.json();
      console.log("Login response received:", data ? "Data received" : "No data");

      if (!response.ok) {
        let message = "Error en el inicio de sesión";
        if (data.error === "Usuario no encontrado") {
          message = "El usuario no existe en el sistema";
        } else if (data.error === "Contraseña incorrecta") {
          message = "La contraseña ingresada es incorrecta";
        }
        setErrorMessage(message);
        setDialogOpen(true);
        sessionStorage.removeItem('loginInProgress');
        throw new Error(data.error || message);
      }

      if (!data.usuario) {
        setErrorMessage("Datos de sesión incompletos");
        setDialogOpen(true);
        sessionStorage.removeItem('loginInProgress');
        throw new Error("Datos de sesión incompletos");
      }

      // Guardar datos en localStorage como respaldo
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.usuario));
      
      // Intentar establecer cookies también
      setCookie("UserData", data.usuario);
      
      // Verificar si las cookies fueron establecidas
      console.log("Cookies check after login:", document.cookie.includes('UserData='));
      
      // Decodificar el token para obtener el rol
      const decoded = jwtDecode(data.token);
      const userRole = decoded.rol;
      
      toast.success('Inicio de sesión exitoso');
      
      // Pequeña pausa para asegurar que los datos se guarden correctamente
      setTimeout(() => {
        // Redirigir según el rol
        if (userRole === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      }, 500);
    } catch (error) {
      console.error('Error durante el login:', error);
      toast.error('Error de conexión');
      sessionStorage.removeItem('loginInProgress');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  return (
    <section className="h-screen flex flex-col md:flex-row justify-center space-y-10 md:space-y-0 md:space-x-16 items-center my-2 mx-5 md:mx-0 md:my-0">
      <div className="md:w-1/3 max-w-sm">
        <img
          src="https://tecdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.webp"
          alt="Sample image"
        />
      </div>
      <div className="md:w-1/3 max-w-sm">
        <div className="text-center md:text-left">
          <label className="mr-1">Sign in with</label>
          <button
            type="button"
            className="mx-1 h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-[0_4px_9px_-4px_#3b71ca]"
          >
            <Icon icon="bi:facebook" className="flex justify-center items-center h-full w-full" />
          </button>
          <button
            type="button"
            className="inlne-block mx-1 h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-700 uppercase leading-normal text-white shadow-[0_4px_9px_-4px_#3b71ca]"
          >
            <Icon icon="bi:google" className="flex justify-center items-center h-full w-full" />
          </button>
          <button
            type="button"
            className="inlne-block mx-1 h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-700 uppercase leading-normal text-white shadow-[0_4px_9px_-4px_#3b71ca]"
          >
            <Icon icon="bi:linkedin" className="flex justify-center items-center h-full w-full" />
          </button>
        </div>
        <div className="my-5 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-neutral-300 after:mt-0.5 after:flex-1 after:border-t after:border-neutral-300">
          <p className="mx-4 mb-0 text-center font-semibold text-slate-500">Or</p>
        </div>
        <form onSubmit={handleLogin}>
          <input
            className="text-sm w-full px-4 py-2 border border-solid border-gray-300 rounded"
            type="text"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="text-sm w-full px-4 py-2 border border-solid border-gray-300 rounded mt-4"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="mt-4 flex justify-between font-semibold text-sm">
            <label className="flex text-slate-500 hover:text-slate-600 cursor-pointer">
              <input className="mr-1" type="checkbox" />
              <span>Remember Me</span>
            </label>
            <a
              className="text-blue-600 hover:text-blue-700 hover:underline hover:underline-offset-4"
              href="#"
            >
              Forgot Password?
            </a>
          </div>
          <div className="text-center md:text-left">
            <button
              className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 text-white uppercase rounded text-xs tracking-wider"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </div>
        </form>
        <div className="mt-4 font-semibold text-sm text-slate-500 text-center md:text-left">
          Don&apos;t have an account?{" "}
          <Link
            to="/signup"
            className="text-red-600 hover:underline hover:underline-offset-4"
          >
            Register
          </Link>
        </div>
        <ErrorDialog
          isOpen={dialogOpen}
          onClose={handleCloseDialog}
          errorMessage={errorMessage}
        />
        <ToastContainer position="top-right" autoClose={5000} />
      </div>
    </section>
  );
};

export default SignInPage;
