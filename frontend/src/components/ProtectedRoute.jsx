import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL, fetchConfig } from '../config';
import { getCookie, setCookie, removeCookie } from '../utils/cookies';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  // Función para manejar errores de autenticación
  const handleAuthError = () => {
    console.log("Error de autenticación, redirigiendo al login");
    
    // Limpiar cookies y localStorage
    removeCookie('Auth');
    removeCookie('UserData');
    
    setIsAuthorized(false);
    setIsLoading(false);
  };

  useEffect(() => {
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
    
    // Evitar múltiples validaciones simultáneas
    const validationInProgress = sessionStorage.getItem('validationInProgress');
    if (validationInProgress === 'true') {
      console.log("Validation already in progress, skipping");
      return;
    }
    
    const checkAuth = async () => {
      // Marcar que la validación está en progreso
      sessionStorage.setItem('validationInProgress', 'true');
      
      try {
        // Intentar obtener datos de usuario (primero de cookie, luego de localStorage)
        const userData = getCookie("UserData");
        
        console.log("User data from cookie/localStorage:", userData ? "Found" : "Not found");
        
        // Si no hay datos de usuario, no estamos autenticados
        if (!userData) {
          console.log("No user data found");
          handleAuthError();
          sessionStorage.removeItem('validationInProgress');
          return;
        }
        
        // Obtener el token (primero de cookie, luego de localStorage)
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
          console.log("No auth token found");
          handleAuthError();
          sessionStorage.removeItem('validationInProgress');
          return;
        }
        
        try {
          // Verificar que el token sea válido
          const decoded = jwtDecode(authToken);
          const currentTime = Date.now() / 1000;
          
          // Verificar si el token ha expirado
          if (decoded.exp && decoded.exp < currentTime) {
            console.log("Token expired");
            handleAuthError();
            sessionStorage.removeItem('validationInProgress');
            return;
          }
          
          // Obtener el rol del usuario
          const userRole = decoded.rol;
          console.log("User role from token:", userRole);
          
          // Verificar si el rol está permitido
          const isRoleAuthorized = allowedRoles.length === 0 || allowedRoles.includes(userRole);
          
          if (!isRoleAuthorized) {
            console.log("User role not authorized for this route");
            setIsAuthorized(false);
            setIsLoading(false);
            sessionStorage.removeItem('validationInProgress');
            return;
          }
          
          // Intentar validar la sesión con el servidor (solo una vez por carga de página)
          if (sessionStorage.getItem('sessionValidated') !== 'true') {
            try {
              console.log("Validating session with server");
              const response = await fetch(`${API_BASE_URL}/users/getSession`, {
                ...fetchConfig
              });
              
              if (response.ok) {
                console.log("Session validated with server");
                sessionStorage.setItem('sessionValidated', 'true');
                const data = await response.json();
                
                // Actualizar datos locales
                if (data.usuario) {
                  setCookie("UserData", data.usuario);
                }
              } else {
                console.log("Server validation failed, but continuing with local data");
                sessionStorage.setItem('sessionValidated', 'failed');
              }
            } catch (error) {
              console.log("Error validating session with server, continuing with local data:", error);
              sessionStorage.setItem('sessionValidated', 'failed');
            }
          } else {
            console.log("Session already validated, skipping server validation");
          }
          
          console.log("User authorized successfully");
          setIsAuthorized(true);
          setIsLoading(false);
        } catch (error) {
          console.error("Error decoding token:", error);
          handleAuthError();
        }
      } catch (error) {
        console.error("Error verificando autenticación:", error);
        handleAuthError();
      } finally {
        // Marcar que la validación ha terminado
        sessionStorage.removeItem('validationInProgress');
      }
    };

    checkAuth();
  }, [allowedRoles, location.pathname]);

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
