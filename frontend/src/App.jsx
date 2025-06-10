import { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { ToastContainer } from "react-toastify";

import SignInPage from "./pages/SignInPage";
import Profile from "./components/UserPerfil";
import HomeAdmin from "./pages/admin/Home";
import InventarioAdmin from "./pages/admin/Inventario";
import ModelManagement from "./pages/admin/ModelManagement";

import HomeDueno from "./pages/dueno/Home";
import InventarioDueno from "./pages/dueno/Inventario";
import OrdenesProveedoresDueno from "./pages/dueno/OrdenesProveedores";
import OrdenesClientesDueno from "./pages/dueno/OrdenesClientes";
import RecomendacionesIADueno from "./pages/dueno/RecomendacionesIA";

import HomeCliente from "./pages/cliente/Home";
import InventarioCliente from "./pages/cliente/Inventario"

import HomeProveedor from "./pages/proveedor/Home";
import InvoiceListProveedorPage from "./pages/proveedor/InvoiceListProveedorPage";
import InvoiceProveedorPage from "./pages/proveedor/InvoiceProveedorPage";
import InvoicePreviewPage from "./pages/InvoicePreviewPage";
import Notificaciones from "./pages/admin/Notificaciones";
import Pedidos from "./pages/admin/Pedidos"
import AiAssistantPage from "./pages/AiAssistantPage";

// Para usuarios admin 
import UsuariosShec from "./pages/admin/UsuariosShec";
import AddUserLayer from "./components/AddUserLayer";
import InvoiceAddLayer from "./components/InvoiceAddLayer";
import EditUserLayer from "./components/EditUser";
import Articulos from "./pages/admin/Articulos";
import AuthHandler from './components/AuthHandler';
import ProtectedRoute from './components/ProtectedRoute';
import AddArticuloLayer from "./components/AddArticuloLayer";
import Location from "./pages/admin/Location";
import AddLocationLayer from "./components/AddLocationLayer";
import EditArticuloLayer from "./components/EditArticuloLayer";
import EditLocationLayer from "./components/EditarLocation";


const App = () => {
  const [role, setRole] = useState(null); // Initially null
  const [loading, setLoading] = useState(true); // Loading state
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://sapitos-backend.cfapps.us10-001.hana.ondemand.com";
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    const fetchSession = async () => {
      try {
        console.log("Fetching session data...");
        const cookieResponse = await fetch(`${API_BASE_URL}/users/getSession`, {
          credentials: "include",
        });

        if (!cookieResponse.ok) {
          console.log(`Session check failed with status: ${cookieResponse.status}`);
          
          // If we haven't exceeded the retry limit, try again
          if (retryCount < maxRetries) {
            console.log(`Retrying session check (${retryCount + 1}/${maxRetries})...`);
            setRetryCount(prev => prev + 1);
            // Wait a bit longer between retries
            setTimeout(() => setLoading(true), 1000);
            return;
          }
          
          setLoading(false);
          return; // No token found, stop execution
        }

        const data = await cookieResponse.json();
        console.log("Session Data:", data);

        // Check if we have user data with role
        if (data.usuario && data.usuario.rol) {
          console.log(`Setting role from usuario object: ${data.usuario.rol}`);
          setRole(data.usuario.rol);
        } else if (data.token) {
          // Decode token as fallback
          try {
            const decoded = jwtDecode(data.token);
            console.log("Decoded JWT:", decoded);
            const userRole = decoded.rol || decoded.ROL;
            console.log(`Setting role from JWT: ${userRole}`);
            setRole(userRole);
          } catch (decodeError) {
            console.error("Error decoding JWT:", decodeError);
            setRole(null);
          }
        } else {
          console.log("No role information found in session");
          setRole(null);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        setRole(null);
      }
      setLoading(false);
    };

    if (loading) {
      fetchSession();
    }
  }, [loading, retryCount]);

  // Show a loading indicator while waiting for the role
  if (loading) {
    console.log("Loading app state...");
    return (
      <div className="loading-screen">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3">Iniciando aplicación...</p>
      </div>
    );
  }

  return (
    <>
      <BrowserRouter>
        <AuthHandler>
          <Routes>
            <Route path="/" element={<SignInPage />} />
            <Route path="/otp" element={<OtpPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                {role === "admin" ? <HomeAdmin /> :
                  role === "dueno" ? <HomeDueno /> :
                  role === "cliente" ? <HomeCliente /> :
                  role === "proveedor" ? <HomeProveedor /> :
                  <Navigate to="/" />}
              </ProtectedRoute>
              }
            />
            <Route 
              path="/inventario" 
              element={
                <ProtectedRoute allowedRoles={["admin", "cliente"]}>
                {role === "admin" ? <InventarioAdmin /> :
                  role === "cliente" ? <InventarioCliente /> :
                  <Navigate to="/dashboard" />}
              </ProtectedRoute>
              } 
            />

            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile/:id" 
              element={
                role ? <Profile /> : <Navigate to="/" />
              } 
            />
            
            <Route 
              path="/preview" 
              element={
                role === "admin" ? <InvoicePreviewPage /> :
                role === "cliente" ? <InvoicePreviewPage/> :
                <Navigate to="/dashboard" />
              } 
            />
            <Route 
              path="/ordenes-proveedores" 
              element={
                <Navigate to="/dashboard" />
                }
              />
            <Route 
              path="/ordenes-clientes" 
              element={
                <Navigate to="/dashboard" />
                }
              />
            <Route 
              path="/recomendaciones-IA" 
              element={
                <Navigate to="/dashboard" />
                }
              />
            <Route 
              path="/ordenes" 
              element={
                role === "proveedor" ? <InvoiceProveedorPage/> :
                <Navigate to="/"/>
                }
              />
            <Route 
              path="/ordenes-aceptadas" 
              element={
                role === "proveedor" ? <InvoiceListProveedorPage aceptadas={true}/> :
                <Navigate to="/"/>
                }
              />
            <Route 
              path="/notificaciones" 
              element={
                role === "admin" ? <Notificaciones /> :
                <Navigate to="/"/>
                }
              />
            <Route 
              path="/ordenes/:id" 
              element={
                role === "proveedor" ? <InvoiceProveedorPage/> :
                <Navigate to="/"/>
                }
              />
            <Route 
              path="/pedidos" 
              element={
                role === "admin" ? <Pedidos/> :
                <Navigate to="/"/>
                }
              />
            <Route 
              path="/usuarios" 
              element={
                role === "admin" ? <UsuariosShec /> :
                <Navigate to="/" />
              } 
            />
            <Route 
      path="/articulos" 
      element={
        role === "admin" ? <Articulos /> :
        <Navigate to="/" />
      }
    />
    <Route 
      path="/Location" 
      element={
        role === "admin" ? <Location /> :
        <Navigate to="/" />
      }
    />

          <Route 
            path="/agregar-usuario" 
            element={
              role === "admin" ? <AddUserLayer /> :
              <Navigate to="/" />
            } 
          />
          <Route 
            path="/agregar-articulo"
            element={
              role === "admin" ? <AddArticuloLayer /> :
              <Navigate to="/" />
            }
          />
          <Route 
            path="/agregar-Location"
            element={
              role === "admin" ? <AddLocationLayer /> :
              <Navigate to="/" />
            }
          />
                  <Route 
            path="/editar-usuario/:userId" 
            element={
              role === "admin" ? <EditUserLayer /> :
              <Navigate to="/" />
            }
          />
          <Route 
    path="/editar-articulo/:id" 
    element={
      role === "admin" ? <EditArticuloLayer /> :
      <Navigate to="/" />
    }
  />
  <Route 
    path="/editar-Location/:id"
    element={
      role === "admin" ? <EditLocationLayer /> :
      <Navigate to="/" />
    }
  />

            <Route 
              path="/modelo-prediccion" 
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <ModelManagement />
                </ProtectedRoute>
              }
            />

            <Route 
              path="/asistente-ia" 
              element={
                <ProtectedRoute allowedRoles={["admin", "dueno", "cliente", "proveedor"]}>
                  <AiAssistantPage />
                </ProtectedRoute>
              }
            />

            <Route 
              path="/crearpedido" 
              element={
                role === "admin" ? <InvoiceAddLayer /> :
                <Navigate to="/" />
              } 
            />

            <Route
              path="/detalle-pedido/:id"
              element={
                role === "admin" ? <InvoicePreviewPage /> :
                role === "cliente" ? <InvoicePreviewPage/> :
                <Navigate to="/dashboard" />
              }
            />
          <Route path="/otp" element={<OtpPage />} />
          <Route 
            path="/agregar-pedido" 
            element={
              role === "admin" ? <InvoiceAddLayer /> :
              <Navigate to="/" />
            }
          />
          <Route path="/ml-management" element={<ModelManagement />} />
          
          {/* Catch-all route for 404 errors */}
          <Route path="*" element={<NotFoundPage />} />
          </Routes> 
        </AuthHandler>
      </BrowserRouter>
      <ToastContainer />
    </>
  );
};

export default App;
