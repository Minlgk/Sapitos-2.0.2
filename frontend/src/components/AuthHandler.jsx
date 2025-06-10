import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * AuthHandler component that intercepts API responses and handles authentication
 */
const AuthHandler = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://sapitos-backend.cfapps.us10-001.hana.ondemand.com";

  // Check if user needs authentication on initial load
  useEffect(() => {
    // Skip check on login and register pages
    const noCheckPaths = ['/', '/register'];
    if (noCheckPaths.includes(location.pathname)) {
      setIsChecking(false);
      return;
    }

    // Also skip if login is in progress (from sessionStorage flag)
    const loginInProgress = sessionStorage.getItem('loginInProgress') === 'true';
    if (loginInProgress) {
      console.log("Login in progress, skipping auth check in AuthHandler");
      setIsChecking(false);
      return;
    }

    // Check if user has a valid session
    const checkSession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/getSession`, {
          credentials: "include",
        });
        
        if (!response.ok) {
          throw new Error("Session check failed");
        }
        
        // Session exists, continue
        setIsChecking(false);
      } catch (error) {
        // No valid session, redirect to login
        console.error("No valid session found:", error);
        
        // Don't redirect if already on login page
        if (location.pathname !== '/') {
          navigate('/', { replace: true });
        } else {
          setIsChecking(false);
        }
      }
    };

    checkSession();
  }, [location.pathname, navigate, API_BASE_URL]);

  useEffect(() => {
    // Set up axios interceptor for API responses
    const interceptor = axios.interceptors.response.use(
      response => {
        // If the response is successful, just return it
        return response;
      },
      error => {
        // Check if error response indicates authentication is required
        if (error.response && error.response.status === 401) {
          const { requiresAuth } = error.response.data;
          
          if (requiresOtp) {
            console.log('OTP verification required, redirecting to OTP page:', message);
            
            // Don't generate OTP on the OTP page itself to prevent loops
            if (location.pathname !== '/otp') {
              // Generate OTP if possible
              try {
                fetch(`${API_BASE_URL}/api/otp/generate`, {
                  method: "GET",
                  credentials: "include",
                })
                .then(res => res.json())
                .then(data => {
                  if (data.secret) {
                    // Store secret in sessionStorage for the OTP page
                    sessionStorage.setItem('otpSecret', data.secret);
                    // Store the return URL to redirect back after OTP verification
                    sessionStorage.setItem('returnUrl', location.pathname);
                  }
                  // Redirect to OTP page
                  navigate('/otp', { replace: true });
                })
                .catch(err => console.error("Error generating OTP:", err));
              } catch (e) {
                console.error("Failed to generate OTP:", e);
                navigate('/otp', { replace: true });
              }
            }
            
            // Don't reject the promise in this case
            return new Promise(() => {});
          } else if (message === 'Unauthorized' || message === 'Invalid token') {
            // Handle general authentication issues
            console.log('Authentication required, redirecting to login page');
            navigate('/', { replace: true });
            return new Promise(() => {});
          }
        }
        return Promise.reject(error);
      }
    );

    // Clean up interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [navigate, location.pathname, API_BASE_URL]);
  
  if (isChecking) {
    return (
      <div className="auth-check-loading d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Verificando autenticación...</span>
          </div>
          <p className="mt-3">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return children;
};

export default AuthHandler;