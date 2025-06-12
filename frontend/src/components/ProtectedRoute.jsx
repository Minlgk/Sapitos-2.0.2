import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '../config';

const ProtectedRoute = ({ children, allowedRoles = [], requireOtp = true }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [otpSettings, setOtpSettings] = useState(null);
  const location = useLocation();

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
        console.log("Checking auth with API_BASE_URL:", API_BASE_URL);
        // Get session from server
        const response = await fetch(`${API_BASE_URL}/users/getSession`, {
          credentials: "include",
        });

        if (!response.ok) {
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        
        if (!data.token) {
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        let userRole;
        try {
          const decoded = jwtDecode(data.token);
          userRole = decoded.rol;
        } catch (error) {
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        // Verificar si el rol está permitido
        const isRoleAuthorized = allowedRoles.length === 0 || allowedRoles.includes(userRole);
        
        if (!isRoleAuthorized) {
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        setIsAuthorized(true);
        setIsLoading(false);
      } catch (error) {
        console.error("Error verificando autenticación:", error);
        setIsAuthorized(false);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [otpSettings, allowedRoles]);

  if (isLoading) {
    return (
      <div className="loading-container d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Verificando autenticación...</span>
          </div>
          <p className="mt-3">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    // Redirigir al login y guardar la ubicación intentada
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
