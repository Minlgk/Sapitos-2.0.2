import React, { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '../config';

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * AuthHandler component that intercepts API responses and handles authentication
 */
const AuthHandler = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Skip check on login and register pages
    const noCheckPaths = ['/', '/register'];
    if (noCheckPaths.includes(location.pathname)) {
      setIsChecking(false);
      return;
    }

    const checkSession = async () => {
      try {
        console.log("Checking session with API_BASE_URL:", API_BASE_URL);
        const response = await fetch(`${API_BASE_URL}/users/getSession`, {
          credentials: "include",
        });

        if (!response.ok) {
          await clearSession();
          return;
        }

        const data = await response.json();
        
        if (!data.token) {
          await clearSession();
          return;
        }

        let userInfo;
        if (data.usuario && data.usuario.rol) {
          userInfo = data.usuario;
        } else if (data.token) {
          try {
            userInfo = jwtDecode(data.token);
          } catch {
            await clearSession();
            return;
          }
        }

        if (userInfo) {
          setUser(userInfo);
          setIsAuthenticated(true);
          
          // If user is on login page but already authenticated, redirect to dashboard
          if (location.pathname === '/') {
            navigate('/dashboard');
          }
        } else {
          await clearSession();
        }
      } catch (error) {
        console.error('Error checking session:', error);
        await clearSession();
      } finally {
        setIsChecking(false);
      }
    };

    checkSession();
  }, [location.pathname, navigate, API_BASE_URL]);

  const clearSession = async () => {
    try {
      await fetch(`${API_BASE_URL}/users/logoutUser`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Error clearing session:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      if (location.pathname !== '/') {
        navigate('/', { replace: true });
      }
    }
  };

  if (isChecking) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Verificando autenticación...</span>
        </div>
      </div>
    );
  }

  const authContextValue = {
    user,
    isAuthenticated,
    clearSession,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthHandler;