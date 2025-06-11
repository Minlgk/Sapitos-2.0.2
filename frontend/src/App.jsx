import { useState, useEffect } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { ToastContainer } from "react-toastify";
import { useAuth } from './components/AuthHandler';

import SignInPage from "./pages/SignInPage";
import Profile from "./components/UserPerfil";
import HomeAdmin from "./pages/admin/Home";
import InventarioAdmin from "./pages/admin/Inventario";
import ModelManagement from "./pages/admin/ModelManagement";

import HomeDueno from "./pages/dueno/Home";
import InventarioDueno from "./pages/dueno/Inventario";
import PedidosDueno from "./pages/dueno/Pedidos";
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
import ProtectedRoute from './components/ProtectedRoute';
import AddArticuloLayer from "./components/AddArticuloLayer";
import Location from "./pages/admin/Location";
import AddLocationLayer from "./components/AddLocationLayer";
import EditArticuloLayer from "./components/EditArticuloLayer";
import EditLocationLayer from "./components/EditarLocation";
import CrearPedidoWarehouse from "./pages/dueno/CrearPedidoWarehouse";
import OrdenesPymesPage from './pages/admin/OrdenesPymesPage';


const App = () => {
  const { user, isAuthenticated } = useAuth();
  const role = user?.rol;

  if (!isAuthenticated && window.location.pathname !== '/') {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<SignInPage />} />
        
        {/* Rutas protegidas */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          }
        />        <Route
          path="/inventario"
          element={
            <ProtectedRoute allowedRoles={["admin", "dueno", "cliente"]}>
              <InventarioRouter />
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
            <ProtectedRoute allowedRoles={["admin", "cliente"]} requireOtp={true}>
              {role === "admin" ? <InvoicePreviewPage /> :
              role === "cliente" ? <InvoicePreviewPage/> :
              <Navigate to="/dashboard" />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/ordenes-proveedores"
          element={
            <ProtectedRoute allowedRoles={["dueno"]} requireOtp={true}>
              <Navigate to="/dashboard" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ordenes-clientes"
          element={
            <ProtectedRoute allowedRoles={["dueno"]} requireOtp={true}>
              <Navigate to="/dashboard" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recomendaciones-IA"
          element={
            <ProtectedRoute allowedRoles={["dueno"]} requireOtp={true}>
              <Navigate to="/dashboard" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ordenes"
          element={
            <ProtectedRoute allowedRoles={["proveedor"]}>
              <InvoiceProveedorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ordenes-aceptadas"
          element={
            <ProtectedRoute allowedRoles={["proveedor"]}>
              <InvoiceListProveedorPage aceptadas={true} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notificaciones"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Notificaciones />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ordenes/:id"
          element={
            <ProtectedRoute allowedRoles={["proveedor"]} requireOtp={true}>
              {role === "proveedor" ? <InvoiceProveedorPage/> :
              <Navigate to="/"/>}
            </ProtectedRoute>
          }
        />        <Route
          path="/pedidos"
          element={
            <ProtectedRoute allowedRoles={["admin", "dueno"]}>
              <PedidosRouter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ordenes-pymes"
          element={
            <ProtectedRoute>
              <OrdenesPymesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <UsuariosShec />
            </ProtectedRoute>
          }
        />
        <Route
          path="/articulos"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Articulos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/location"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Location />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-assistant"
          element={
            <ProtectedRoute>
              <AiAssistantPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/agregar-usuario"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AddUserLayer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agregar-articulo"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AddArticuloLayer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agregar-Location"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AddLocationLayer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editar-usuario/:userId"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <EditUserLayer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editar-articulo/:id"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <EditArticuloLayer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editar-Location/:id"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <EditLocationLayer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/modelo-prediccion"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ModelManagement />
            </ProtectedRoute>
          }
        />        <Route
          path="/crearpedido"
          element={
            <ProtectedRoute allowedRoles={["dueno"]}>
              <InvoiceAddLayer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/detalle-pedido/:id"
          element={
            <ProtectedRoute allowedRoles={["admin", "cliente"]}>
              <InvoicePreviewPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pedidowarehouse"
          element={
            <ProtectedRoute allowedRoles={["dueno"]}>
              <CrearPedidoWarehouse />
            </ProtectedRoute>
          }
        />



        {/* Ruta de fallback para rutas no encontradas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </>
  );
};

// Componente auxiliar para manejar el dashboard según el rol
const DashboardRouter = () => {
  const checkRole = async () => {
    try {
      const response = await fetch("http://localhost:5000/users/getSession", {
        credentials: "include",
      });
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.token) {
        const decoded = jwtDecode(data.token);
        return decoded.rol;
      }
      return null;
    } catch (error) {
      console.error("Error checking role:", error);
      return null;
    }
  };

  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkRole().then(userRole => {
      setRole(userRole);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  switch (role) {
    case "admin":
      return <HomeAdmin />;
    case "dueno":
      return <HomeDueno />;
    case "cliente":
      return <HomeCliente />;
    case "proveedor":
      return <HomeProveedor />;
    default:
      return <Navigate to="/" replace />;
  }
};

// Componente auxiliar para manejar el inventario según el rol
const InventarioRouter = () => {
  const checkRole = async () => {
    try {
      const response = await fetch("http://localhost:5000/users/getSession", {
        credentials: "include",
      });
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.token) {
        const decoded = jwtDecode(data.token);
        return decoded.rol;
      }
      return null;
    } catch (error) {
      console.error("Error checking role:", error);
      return null;
    }
  };

  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkRole().then(userRole => {
      setRole(userRole);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }  switch (role) {
    case "admin":
      return <InventarioAdmin />;
    case "dueno":
      return <InventarioDueno />;
    case "cliente":
      return <InventarioCliente />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

// Componente auxiliar para manejar los pedidos según el rol
const PedidosRouter = () => {
  const checkRole = async () => {
    try {
      const response = await fetch("http://localhost:5000/users/getSession", {
        credentials: "include",
      });
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.token) {
        const decoded = jwtDecode(data.token);
        return decoded.rol;
      }
      return null;
    } catch (error) {
      console.error("Error checking role:", error);
      return null;
    }
  };

  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkRole().then(userRole => {
      setRole(userRole);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }  switch (role) {
    case "admin":
      return <Pedidos />;
    case "dueno":
      return <PedidosDueno />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

export default App;
