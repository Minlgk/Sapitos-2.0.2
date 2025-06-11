import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import axios from "axios";
import Swal from "sweetalert2";

const OrdenesPymes = () => {
  const [pedidos, setPedidos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchPedidos();
  }, []);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/admin/pedidos-pymes', {
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
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: `¿Deseas aceptar este pedido? El estado cambiará a "En Reparto".`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, aceptar',
        cancelButtonText: 'Cancelar'
      });

      if (!result.isConfirmed) return;

      const endpoint = `http://localhost:5000/admin/pedido-pyme/${id}/aprobar`;
      const response = await axios.put(endpoint, {}, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      console.log("Respuesta de actualización:", response.data);

      Swal.fire({
        icon: "success",
        title: "Pedido Aceptado",
        text: "El pedido ha sido aceptado y está ahora En Reparto"
      });

      fetchPedidos();
    } catch (error) {
      console.error("Error al aceptar el pedido:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "No se pudo aceptar el pedido"
      });
    }
  };

  const handleRechazarPedido = async (id) => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Deseas rechazar este pedido? Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, rechazar',
        cancelButtonText: 'Cancelar'
      });

      if (!result.isConfirmed) return;

      const endpoint = `http://localhost:5000/admin/pedido-pyme/${id}/rechazar`;
      const response = await axios.put(endpoint, {}, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      Swal.fire({
        icon: "success",
        title: "Pedido Rechazado",
        text: "El pedido ha sido rechazado exitosamente"
      });

      fetchPedidos();
    } catch (error) {
      console.error("Error al rechazar el pedido:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "No se pudo rechazar el pedido"
      });
    }
  };

  const handleVerDetalles = async (id) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/admin/pedido-pyme/${id}/detalle`,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      
      setSelectedPedido({
        id,
        detalles: response.data
      });
      setShowDetails(true);
    } catch (error) {
      console.error("Error al obtener detalles:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los detalles del pedido"
      });
    }
  };

  const pedidosFiltrados = pedidos.filter(pedido =>
    (pedido.solicitadoPor || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pedido.displayId || "").includes(searchTerm) ||
    (pedido.organizacion || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pendiente': return 'px-12 py-1 rounded-pill fw-medium text-xs bg-warning-focus text-warning-main';
      case 'En Reparto': return 'px-12 py-1 rounded-pill fw-medium text-xs bg-primary-focus text-primary-main';
      case 'Completado': return 'px-12 py-1 rounded-pill fw-medium text-xs bg-success-focus text-success-main';
      default: return 'px-12 py-1 rounded-pill fw-medium text-xs bg-secondary-focus text-secondary-main';
    }
  };

  const getActionButtons = (pedido) => {
    switch (pedido.estatus) {
      case 'Pendiente':
        return (
          <div className="d-flex gap-2">
            <button 
              onClick={() => handleActualizarEstatus(pedido.id, "En Reparto")}
              className='w-32-px h-32-px bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center'
              style={{ border: 'none' }}
              title="Aceptar pedido"
            >
              <Icon icon='mdi:check-bold' width="24" height="24" />
            </button>
            <button 
              onClick={() => handleRechazarPedido(pedido.id)}
              className='w-32-px h-32-px bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center'
              style={{ border: 'none' }}
              title="Rechazar pedido"
            >
              <Icon icon='mingcute:close-circle-line' width="24" height="24" />
            </button>
            <button 
              onClick={() => handleVerDetalles(pedido.id)}
              className='w-32-px h-32-px bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center'
              style={{ border: 'none' }}
              title="Ver detalles"
            >
              <Icon icon='iconamoon:eye-light' width="24" height="24" />
            </button>
          </div>
        );
      
      default:
        return (
          <div className="d-flex gap-2">
            <button 
              onClick={() => handleVerDetalles(pedido.id)}
              className='w-32-px h-32-px bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center'
              style={{ border: 'none' }}
              title="Ver detalles"
            >
              <Icon icon='iconamoon:eye-light' width="24" height="24" />
            </button>
          </div>
        );
    }
  };

  return (
    <div className='card'>
      <div className='card-header d-flex flex-wrap align-items-center justify-content-between gap-3'>
        <div className='d-flex flex-wrap align-items-center gap-3'>
          <span>Gestión de Pedidos PYMES</span>
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
          className="w-32-px h-32-px bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center"
          onClick={fetchPedidos}
          disabled={loading}
          style={{ border: 'none' }}
          title="Actualizar"
        >
          <Icon icon='mdi:refresh' width="20" height="20" />
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

export default OrdenesPymes; 