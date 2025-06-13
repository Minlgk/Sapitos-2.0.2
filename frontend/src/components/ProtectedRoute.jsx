import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '../config';
import { getCookie, setCookie } from '../utils/cookies';

const ProtectedRoute = ({ children, allowedRoles = [], requireOtp = true }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [otpSettings, setOtpSettings] = useState(null);
  const location = useLocation();

  // Función para manejar errores de autenticación
  const handleAuthError = () => {
    console.log("Error de autenticación, redirigiendo al login");
    // Limpiar cualquier cookie existente
    document.cookie = 'Auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=none';
    document.cookie = 'UserData=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=none';
    setIsAuthorized(false);
    setIsLoading(false);
  };

  useEffect(() => {
    const fetchOtpSettings = async () => {
      try {
        console.log("Fetching OTP settings from:", `${API_BASE_URL}/api/settings/otp`);
        const response = await fetch(`${API_BASE_URL}/api/settings/otp`, {
          credentials: "include",
        });
        
        if (response.ok) {
          const settings = await response.json();
          console.log("OTP settings received:", settings);
          setOtpSettings(settings);
        } else {
          console.log("Could not fetch OTP settings, defaulting to requireOtp=true");
          setOtpSettings({ requireOtp: true });
        }
      } catch (error) {
        console.error("Error fetching OTP settings:", error);
        setOtpSettings({ requireOtp: true });
      }
    };

    fetchOtpSettings();
  }, []);

  useEffect(() => {
    if (otpSettings === null) return;
    
    // Check if we're in the middle of a login process
    const loginInProgress = sessionStorage.getItem('loginInProgress') === 'true';
    
    // If login is in progress, we'll consider the user authorized for this transition
    // This prevents redirects during the login -> dashboard transition
    if (loginInProgress) {
      console.log("Login in progress, bypassing auth check for smooth transition");
      sessionStorage.removeItem('loginInProgress');
      setIsAuthorized(true);
      setIsLoading(false);
      return;
    }
    
    const checkAuth = async () => {
      try {
        // Primero verificar si tenemos cookies locales
        const userDataCookie = getCookie("UserData");
        const authCookie = document.cookie.includes('Auth=');
        
        console.log("Checking session with API_BASE_URL:", API_BASE_URL);
        console.log("Local cookies check:", { userDataCookie: !!userDataCookie, authCookie });
        
        // Si no hay cookies, no estamos autenticados
        if (!authCookie) {
          console.log("No Auth cookie found locally");
          handleAuthError();
          return;
        }
        
        // Get session from server
        const response = await fetch(`${API_BASE_URL}/users/getSession`, {
          credentials: "include",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.log("Session validation failed:", response.status);
          handleAuthError();
          return;
        }

        const data = await response.json();
        
        if (!data.token || !data.usuario) {
          console.log("Invalid session data received");
          handleAuthError();
          return;
        }

        // Actualizar las cookies locales con los datos más recientes
        setCookie("UserData", data.usuario, { 
          maxAge: 24 * 60 * 60, // 24 horas en segundos
          path: "/",
          secure: true,
          sameSite: "None"
        });

        let userRole;
        try {
          const decoded = jwtDecode(data.token);
          userRole = decoded.rol;
          console.log("User role from token:", userRole);
        } catch (error) {
          console.error("Error decoding token:", error);
          handleAuthError();
          return;
        }

        // Verificar si el rol está permitido
        const isRoleAuthorized = allowedRoles.length === 0 || allowedRoles.includes(userRole);
        
        if (!isRoleAuthorized) {
          console.log("User role not authorized for this route");
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        console.log("User authorized successfully");
        setIsAuthorized(true);
        setIsLoading(false);
      } catch (error) {
        console.error("Error verificando autenticación:", error);
        handleAuthError();
      }
    };

    checkAuth();
  }, [allowedRoles, location.pathname, otpSettings]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
