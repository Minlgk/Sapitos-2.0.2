import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { notify, NotificationType } from "./NotificationService";
import Swal from "sweetalert2";

const useUserSession = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await axios.get('http://localhost:5000/users/getSession', {
          withCredentials: true
        });
        
        if (response.data && response.data.usuario) {
          setSession({
            userId: response.data.usuario.id,
            nombre: response.data.usuario.nombre,
            email: response.data.usuario.correo,
            rol: response.data.usuario.rol,
            locationId: response.data.usuario.locationId
          });
        }
      } catch (error) {
        console.error('Error al obtener sesión:', error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  return { session, loading };
};

const PedidoDueno = () => {
  const [pedidoEnviado, setPedidoEnviado] = useState(false);
  const [pedidoID, setPedidoID] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { session, loading: sessionLoading } = useUserSession();
  const navigate = useNavigate();

  const validatePedidoData = (pedidoData) => {
    const errors = [];
    
    if (!pedidoData.creadoPorId || isNaN(pedidoData.creadoPorId)) {
      errors.push("ID de usuario inválido");
    }
    
    if (!pedidoData.productos?.length) {
      errors.push("No hay productos seleccionados");
    }
    
    if (!pedidoData.total || pedidoData.total <= 0) {
      errors.push("Total inválido");
    }
    
    return errors;
  };

  const handleEnviarPedido = async (productos, total) => {
    try {
      const result = await Swal.fire({
        title: "¿Realizar pedido?",
        text: "Se enviará el pedido a la Warehouse",
        icon: "info",
        iconColor: '#28a745',
        showCancelButton: true,
        confirmButtonText: "Realizar pedido",
        cancelButtonText: "Cancelar",
        customClass: {
          popup: 'swal-compact',
          title: 'text-lg mb-2',
          htmlContainer: 'text-sm mb-3',
          actions: 'd-flex gap-3 justify-content-center mt-3',
          confirmButton: 'px-4 py-2 border border-2 border-success-600 bg-success-600 text-white text-sm fw-semibold rounded',
          cancelButton: 'px-4 py-2 border border-2 border-secondary-600 bg-white text-secondary-600 text-sm fw-semibold rounded'
        },
        buttonsStyling: false,
        width: '330px',
        padding: '1rem'
      });

      if (result.isConfirmed) {
        const productosFormateados = productos
          .filter(p => p.cantidad > 0)
          .map(p => ({
            articuloId: p.articuloId || p.id,
            cantidad: parseInt(p.cantidad),
            precio: parseFloat(p.precioCompra || p.precio || 0)
          }));

        const pedidoData = {
          creadoPorId: parseInt(session.userId),
          tipoOrden: 'Compra',
          organizacion: "Warehouse",
          total: parseFloat(total),
          metodoPagoId: 1,
          descuentoAplicado: 0,
          locationId: session.locationId,
          productos: productosFormateados
        };

        const validationErrors = validatePedidoData(pedidoData);
        if (validationErrors.length > 0) {
          setError(validationErrors.join(". "));
          return;
        }

        setIsSubmitting(true);
        setError(null);        
        const response = await axios.post("http://localhost:5000/pedido", pedidoData, {
          withCredentials: true
        });
        
        if (response.data?.ordenId) {
          setPedidoID(response.data.ordenId);
          setPedidoEnviado(true);
          notify("¡Pedido creado exitosamente!", NotificationType.SUCCESS);
          setTimeout(() => navigate("/pedidos"), 2500);
        } else {
          throw new Error("No se recibió el ID del pedido");
        }
      }
    } catch (err) {
      console.error("Error al enviar pedido:", err);
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      notify(errorMsg, NotificationType.ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNuevoPedido = () => {
    setPedidoEnviado(false);
    setPedidoID(null);
    setError(null);
  };

  if (sessionLoading) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <Icon icon="mdi:loading" className="text-primary text-2xl animate-spin mb-3" />
          <p>Cargando información de sesión...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <Icon icon="mdi:alert-circle" className="text-danger text-2xl mb-3" />
          <p>Error: No se pudo cargar la información de sesión</p>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='card'>
      <EncabezadoFormulario isSubmitting={isSubmitting} session={session} />
      <div className='card-body py-40'>
        {error && (
          <div className='alert alert-danger text-sm mb-4'>
            <Icon icon='mdi:alert-circle-outline' className='me-2 text-lg' />
            {error}
          </div>
        )}
        {pedidoEnviado && (
          <div className='alert alert-success text-sm mb-4'>
            <Icon icon='mdi:check-circle-outline' className='me-2 text-lg' />
            Pedido #{pedidoID} enviado con éxito.
            <button 
              className='btn btn-sm btn-outline-success ms-3'
              onClick={handleNuevoPedido}
            >
              Crear Nuevo Pedido
            </button>
          </div>
        )}
        <div className='row justify-content-center'>
          <div className='col-lg-10'>
            <div className='shadow-4 border radius-8'>
              <InformacionPedido pedidoID={pedidoID} session={session} />
              <TablaProductos 
                onEnviarPedido={handleEnviarPedido} 
                isSubmitting={isSubmitting}
                pedidoEnviado={pedidoEnviado}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EncabezadoFormulario = ({ isSubmitting, session }) => (
  <div className='card-header'>
    <div className='d-flex flex-wrap align-items-center justify-content-between'>
      <div>
        <h2 className='card-title mb-0'>Nuevo Pedido a Warehouse</h2>
        <small className='text-muted'>Creado por: {session?.nombre}</small>
      </div>
      {isSubmitting && (
        <div className='text-primary'>
          <Icon icon='mdi:loading' className='me-2 text-lg animate-spin' />
          Procesando...
        </div>
      )}
    </div>
  </div>
);

const InformacionPedido = ({ pedidoID, session }) => {
  const fechaHoy = new Date().toLocaleDateString("es-MX", {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className='p-20 border-bottom'>
      <div className='row justify-content-between g-3'>
        <div className='col-sm-6'>
          <h3 className='text-xl'>Pedido {pedidoID ? `#${pedidoID}` : "Nuevo"}</h3>
          <p className='mb-1 text-sm'>
            Fecha: <span className='fw-semibold'>{fechaHoy}</span>
          </p>
          <p className='mb-1 text-sm'>
            Solicitado por: <span className='fw-semibold'>{session?.nombre}</span>
          </p>
          <p className='mb-0 text-sm'>
            Email: <span className='fw-semibold'>{session?.email}</span>
          </p>
        </div>
        <div className='col-sm-6 text-end'>
          <div className='bg-light p-3 rounded'>
            <h6 className='mb-0'>Warehouse Central</h6>
            <small className='text-muted'>Pedido a almacén central</small>
          </div>
        </div>
      </div>
    </div>
  );
};

const TablaProductos = ({ onEnviarPedido, isSubmitting, pedidoEnviado }) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorProductos, setErrorProductos] = useState(null);

  useEffect(() => {
    const fetchProductos = async () => {
      setLoading(true);
      setErrorProductos(null);
      
      try {
        const response = await axios.get('http://localhost:5000/pedido/warehouse/productos');
        const productosData = (response.data || []).map(prod => ({
          ...prod,
          cantidad: 0,
        }));
        setProductos(productosData);
      } catch (error) {
        setErrorProductos("Error al cargar los productos de la warehouse");
        setProductos([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductos();
  }, []);

  useEffect(() => {
    if (pedidoEnviado) {
      setProductos(prev => prev.map(p => ({ ...p, cantidad: 0 })));
    }
  }, [pedidoEnviado]);

  const handleCantidadChange = (index, value) => {
    const nuevaCantidad = Math.max(0, parseInt(value) || 0);
    const nuevosProductos = [...productos];
    nuevosProductos[index].cantidad = nuevaCantidad;
    setProductos(nuevosProductos);
  };

  const calcularSubtotal = () => {
    return productos.reduce((total, producto) => {
      const precioNumerico = parseFloat(producto.precioCompra || producto.precio || 0);
      const cantidad = parseInt(producto.cantidad || 0);
      return total + (precioNumerico * cantidad);
    }, 0);
  };

  const subtotal = calcularSubtotal();
  const descuento = 0;
  const impuesto = 0;
  const total = subtotal - descuento + impuesto;

  const productosSeleccionados = productos.filter(p => p.cantidad > 0);
  const puedeEnviar = !isSubmitting && 
                    productos.length > 0 && 
                    productosSeleccionados.length > 0 && 
                    total > 0;

  return (
    <div className='py-28 px-20'>
      <div className='mb-20'>
        <h5 className="text-center">Pedido a Warehouse</h5>
        <p className="text-center text-muted">Selecciona los productos que necesitas de la warehouse central</p>
      </div>

      {errorProductos && (
        <div className='alert alert-warning text-sm mb-4'>
          <Icon icon='mdi:alert-circle-outline' className='me-2 text-lg' />
          {errorProductos}
        </div>
      )}

      {loading && (
        <div className='text-center py-4'>
          <Icon icon='mdi:loading' className='text-lg animate-spin me-2' />
          Cargando productos...
        </div>
      )}

      {productosSeleccionados.length > 0 && (
        <div className='mt-3 p-3 bg-light rounded'>
          <div className='row'>
            <div className='col-sm-6'>
              <small className='text-muted'>
                <strong>Productos seleccionados:</strong> {productosSeleccionados.length}
              </small>
            </div>
            <div className='col-sm-6 text-end'>
              <small className='text-muted'>
                <strong>Total estimado:</strong> ${total.toFixed(2)}
              </small>
            </div>
          </div>
        </div>
      )}

      {productos.length > 0 && (
        <div className='table-responsive mt-4'>
          <table className='table table-striped'>
            <thead className='table-dark'>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Stock Actual</th>
                <th>Precio Compra</th>
                <th>Cantidad</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((producto, index) => {
                const precioNumerico = parseFloat(producto.precioCompra || producto.precio || 0);
                const cantidad = parseInt(producto.cantidad || 0);
                const subtotalProducto = precioNumerico * cantidad;
                
                return (
                  <tr key={index} className={cantidad > 0 ? 'table-success' : ''}>
                    <td>
                      <div>
                        <strong>{producto.nombre || 'Sin nombre'}</strong>
                        {producto.temporada && (
                          <small className='d-block text-muted'>
                            Temporada: {producto.temporada}
                          </small>
                        )}
                      </div>
                    </td>
                    <td>{producto.categoria || 'N/A'}</td>
                    <td>
                      <span className={producto.stockActual <= 10 ? 'text-danger' : 'text-success'}>
                        {producto.stockActual || 0}
                      </span>
                    </td>
                    <td>
                      <strong>${precioNumerico.toFixed(2)}</strong>
                    </td>
                    <td>
                      <input
                        type='number'
                        min='0'
                        max={producto.stockActual || 999}
                        value={cantidad}
                        onChange={(e) => handleCantidadChange(index, e.target.value)}
                        className='form-control'
                        style={{ width: '80px' }}
                      />
                    </td>
                    <td>
                      <strong>${subtotalProducto.toFixed(2)}</strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {productos.length > 0 && (
        <div className='mt-4'>
          <div className='row justify-content-end'>
            <div className='col-sm-6'>
              <div className='card'>
                <div className='card-body'>
                  <h6 className='card-title'>Resumen del Pedido a Warehouse</h6>
                  <div className='d-flex justify-content-between mb-2'>
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className='d-flex justify-content-between mb-2'>
                    <span>Descuento:</span>
                    <span>-${descuento.toFixed(2)}</span>
                  </div>
                  <div className='d-flex justify-content-between mb-2'>
                    <span>Impuesto:</span>
                    <span>${impuesto.toFixed(2)}</span>
                  </div>
                  <hr />
                  <div className='d-flex justify-content-between mb-3'>
                    <strong>Total:</strong>
                    <strong className='text-primary'>${total.toFixed(2)}</strong>
                  </div>
                  <button
                    className='btn btn-primary w-100'
                    onClick={() => onEnviarPedido(productos, total)}
                    disabled={!puedeEnviar}
                  >
                    {isSubmitting ? (
                      <>
                        <Icon icon='mdi:loading' className='me-2 animate-spin' />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Icon icon='mdi:send' className='me-2' />
                        Enviar Pedido a Warehouse
                      </>
                    )}
                  </button>
                  {!puedeEnviar && !isSubmitting && (
                    <small className='text-muted d-block mt-2'>
                      {productos.length === 0 && 'Carga productos. '}
                      {productosSeleccionados.length === 0 && productos.length > 0 && 'Selecciona al menos un producto.'}
                    </small>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && productos.length === 0 && !errorProductos && (
        <div className='text-center py-5'>
          <Icon icon='mdi:package-variant' className='text-muted text-3xl mb-3' />
          <p className='text-muted'>No se encontraron productos en la warehouse.</p>
        </div>
      )}
    </div>
  );
};

export default PedidoDueno;