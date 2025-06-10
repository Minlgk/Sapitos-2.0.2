import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import axios from "axios";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";

const InvoiceProveedor = () => {
  const [pedidos, setPedidos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://sapitos-backend.cfapps.us10-001.hana.ondemand.com";

  useEffect(() => {
    fetchPedidos();
  }, []);

  // Funcion pricipal para obtener los pedidos
  // Verifica la sesión del usuario y obtiene el locationId
  const fetchPedidos = async () => {
    try {
      setLoading(true);
      console.log("Loading...");
      
      // Intentar obtener la sesión utilizando el mismo API_BASE_URL
      const sessionResponse = await fetch(`${API_BASE_URL}/users/getSession`, {
        credentials: "include", 
      });

      if (!sessionResponse.ok) {
        throw new Error("No se pudo verificar la sesión");
      }

      const sessionData = await sessionResponse.json();
      console.log("Session Data: ", sessionData);
      
      let locationId;
      let roleId;

      if (sessionData.usuario && sessionData.usuario.locationId) {
        locationId = sessionData.usuario.locationId; 
        roleId = sessionData.usuario.ROL_ID; 
      } else if (sessionData.token) {
        try {
          const decoded = jwtDecode(sessionData.token);
          locationId = decoded.locationId;
          roleId = decoded.roleId;
        } catch (e) {
          throw new Error("Error al decodificar el token");
        }
      }

      if (!locationId) {
        throw new Error("Location ID no encontrado en la sesión");
      }

      // Usar el URL correcto para obtener los pedidos del proveedor
      const url = `${API_BASE_URL}/proveedor/pedidos/${locationId}`;
      console.log("Fetching orders from:", url);
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include', 
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'No se pudieron cargar los pedidos');
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        console.error("Los datos recibidos no son un array:", data);
        throw new Error("Formato de datos inesperado del servidor");
      }
      
      const formattedPedidos = data.map((pedido, index) => ({
        numero: String(index + 1).padStart(2, '0'),
        id: pedido.id,
        displayId: `#${pedido.id}`,
        solicitadoPor: pedido.solicitadoPor || "N/A",
        correoSolicitante: pedido.correoSolicitante || "",
        fecha: formatDate(pedido.fecha),
        cantidad: pedido.total || 0,
        estatus: pedido.estado || "Pendiente",
        organizacion: pedido.organizacion || "N/A",
        fechaEstimada: pedido.fechaEstimada,
        tipoOrden: pedido.tipoOrden,
        descuento: pedido.descuento || 0
      }));
      setPedidos(formattedPedidos);
    } catch (error) {
      console.error("Error al obtener los pedidos:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudieron cargar los pedidos"
      });
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return `${day} ${months[month]} ${year}`;
  };

  const handleActualizarEstatus = async (id, nuevoEstatus) => {
    try {
      // Mostrar confirmación antes de proceder
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: `¿Deseas ${nuevoEstatus === "Aprobado" ? "aceptar" : "rechazar"} este pedido?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: nuevoEstatus === "Aprobado" ? '#28a745' : '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: `Sí, ${nuevoEstatus === "Aprobado" ? "aceptar" : "rechazar"}`,
        cancelButtonText: 'Cancelar'
      });

      if (!result.isConfirmed) {
        return;
      }

      // ENDPOINTS CORREGIDOS para coincidir con las rutas del backend
      const endpoint = nuevoEstatus === "Aprobado" 
        ? `${API_BASE_URL}/proveedor/pedido/${id}/aprobar` 
        : `${API_BASE_URL}/proveedor/pedido/${id}/rechazar`;
      
      console.log("Actualizando pedido:", id, "a estado:", nuevoEstatus);
      console.log("Endpoint:", endpoint);
      
      // Usar fetch en lugar de axios para mantener consistencia con otros llamados
      const response = await fetch(endpoint, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'No se pudo actualizar el pedido');
      }
      
      const responseData = await response.json();
      console.log("Respuesta de actualización:", responseData);
      
      Swal.fire({
        icon: "success",
        title: "Actualizado",
        text: `El pedido ha sido ${nuevoEstatus === "Aprobado" ? "aceptado" : "rechazado"} exitosamente`
      });
      
      // Recargar la lista de pedidos
      fetchPedidos();
      
    } catch (error) {
      console.error("Error al actualizar el pedido:", error);
      
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo actualizar el pedido"
      });
    }
  };

  const handleEnviarPedido = async (id) => {
    try {
      const result = await Swal.fire({
        title: '¿Enviar pedido?',
        text: 'Esto marcará el pedido como "En Reparto" y actualizará el inventario',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#17a2b8',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, enviar',
        cancelButtonText: 'Cancelar'
      });

      if (!result.isConfirmed) {
        return;
      }

      // Usar fetch en lugar de axios para mantener consistencia con otros llamados
      const response = await fetch(
        `${API_BASE_URL}/proveedor/pedido/${id}/enviar`, 
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'No se pudo enviar el pedido');
      }
      
      const responseData = await response.json();
      
      Swal.fire({
        icon: "success",
        title: "Pedido Enviado",
        text: responseData.message || "Pedido enviado exitosamente"
      });
      
      fetchPedidos();
      
    } catch (error) {
      console.error("Error al enviar el pedido:", error);
      
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo enviar el pedido"
      });
    }
  };

  const handleVerDetalles = async (id) => {
    try {
      // Usar fetch en lugar de axios para mantener consistencia con otros llamados
      const response = await fetch(
        `${API_BASE_URL}/proveedor/pedido/${id}/detalle`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'No se pudieron cargar los detalles');
      }
      
      const responseData = await response.json();
      
      setSelectedPedido({
        id,
        detalles: responseData
      });
      setShowDetails(true);
      
    } catch (error) {
      console.error("Error al obtener detalles:", error);
      
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudieron cargar los detalles del pedido"
      });
    }
  };

  const pedidosFiltrados = Array.isArray(pedidos) ? pedidos.filter(pedido =>
    (pedido.solicitadoPor || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pedido.displayId || "").includes(searchTerm) ||
    (pedido.organizacion || "").toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pendiente': return 'bg-warning text-dark';
      case 'Aprobado': return 'bg-info';
      case 'En Reparto': return 'bg-primary';
      case 'Completado': return 'bg-success';
      case 'Rechazado': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getActionButtons = (pedido) => {
    switch (pedido.estatus) {
      case 'Pendiente':
        return (
          <div className="d-flex gap-2">
            <button 
              className="btn btn-success btn-sm" 
              onClick={() => handleActualizarEstatus(pedido.id, "Aprobado")}
            >
              <Icon icon='mdi:check' className="me-1" />
              Aceptar
            </button>
            <button 
              className="btn btn-danger btn-sm" 
              onClick={() => handleActualizarEstatus(pedido.id, "Rechazado")}
            >
              <Icon icon='mdi:close' className="me-1" />
              Rechazar
            </button>
            <button 
              className="btn btn-outline-primary btn-sm" 
              onClick={() => handleVerDetalles(pedido.id)}
            >
              <Icon icon='mdi:eye' className="me-1" />
              Ver
            </button>
          </div>
        );
      
      case 'Aprobado':
        return (
          <div className="d-flex gap-2">
            <button 
              className="btn btn-info btn-sm" 
              onClick={() => handleEnviarPedido(pedido.id)}
            >
              <Icon icon='mdi:truck' className="me-1" />
              Enviar
            </button>
            <button 
              className="btn btn-outline-primary btn-sm" 
              onClick={() => handleVerDetalles(pedido.id)}
            >
              <Icon icon='mdi:eye' className="me-1" />
              Ver
            </button>
          </div>
        );
      
      default:
        return (
          <div className="d-flex gap-2">
            <span className="text-muted small">
              {pedido.estatus === 'Completado' ? 'Completado' : 
               pedido.estatus === 'En Reparto' ? 'En Reparto' : 
               pedido.estatus}
            </span>
            <button 
              className="btn btn-outline-primary btn-sm" 
              onClick={() => handleVerDetalles(pedido.id)}
            >
              <Icon icon='mdi:eye' className="me-1" />
              Ver
            </button>
          </div>
        );
    }
  };

  return (
    <div className='card'>
      <div className='card-header d-flex flex-wrap align-items-center justify-content-between gap-3'>
        <div className='d-flex flex-wrap align-items-center gap-3'>
          <span>Gestión de Pedidos</span>
          <div className='icon-field'>
            <input
              type='text'
              name='search'
              className='form-control form-control-sm w-auto'
              placeholder='Buscar por solicitante, ID u organización'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className='icon'>
              <Icon icon='ion:search-outline' />
            </span>
          </div>
        </div>
        <button 
          className="btn btn-primary btn-sm"
          onClick={fetchPedidos}
          disabled={loading}
        >
          <Icon icon='mdi:refresh' className="me-1" />
          Actualizar
        </button>
      </div>
      
      <div className='card-body'>
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-2">Cargando pedidos...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className='table bordered-table mb-0'>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>ID</th>
                  <th>Solicitado Por</th>
                  <th>Organización</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.length > 0 ? (
                  pedidosFiltrados.map((pedido, idx) => (
                    <tr key={`pedido-${pedido.id}-${idx}`}>
                      <td>{pedido.numero}</td>
                      <td>{pedido.displayId}</td>
                      <td>
                        <div>
                          <div className="fw-medium">{pedido.solicitadoPor}</div>
                          {pedido.correoSolicitante && (
                            <small className="text-muted">{pedido.correoSolicitante}</small>
                          )}
                        </div>
                      </td>
                      <td>{pedido.organizacion}</td>
                      <td>{pedido.fecha}</td>
                      <td>${parseFloat(pedido.cantidad).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(pedido.estatus)}`}>
                          {pedido.estatus}
                        </span>
                      </td>
                      <td>
                        {getActionButtons(pedido)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      {searchTerm ? 
                        `No se encontraron pedidos que coincidan con "${searchTerm}"` : 
                        "No hay pedidos disponibles"
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para mostrar detalles */}
      {showDetails && selectedPedido && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Detalles del Pedido #{selectedPedido.id}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowDetails(false)}
                ></button>
              </div>
              <div className="modal-body">
                {selectedPedido.detalles.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Categoría</th>
                          <th>Cantidad</th>
                          <th>Precio Unit.</th>
                          <th>Subtotal</th>
                          <th>Stock Disponible</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPedido.detalles.map((detalle, idx) => (
                          <tr key={idx}>
                            <td>{detalle.nombre}</td>
                            <td>{detalle.categoria}</td>
                            <td>{detalle.cantidad}</td>
                            <td>${parseFloat(detalle.precioUnitario).toFixed(2)}</td>
                            <td>${parseFloat(detalle.subtotal).toFixed(2)}</td>
                            <td>
                              <span className={`badge ${
                                detalle.stockDisponible >= detalle.cantidad 
                                  ? 'bg-success' 
                                  : 'bg-warning text-dark'
                              }`}>
                                {detalle.stockDisponible}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <th colSpan="4">Total:</th>
                          <th>
                            ${selectedPedido.detalles.reduce((total, det) => 
                              total + parseFloat(det.subtotal), 0
                            ).toFixed(2)}
                          </th>
                          <th></th>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <p>No se encontraron detalles para este pedido.</p>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowDetails(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default InvoiceProveedor;