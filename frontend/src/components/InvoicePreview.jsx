import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useParams, useNavigate } from "react-router-dom";

const InvoicePreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState({ nombre: '', rol: '', email: '' });
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://sapitos-backend.cfapps.us10-001.hana.ondemand.com";
  
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/getSession`, {
          credentials: 'include' 
        });
        
        const data = await response.json();
        if (data && data.usuario) {
          setSession({
            userId: data.usuario.id,
            nombre: data.usuario.nombre,
            email: data.usuario.correo,
            rol: data.usuario.rol
          });
        }
      } catch (error) {
        console.error('Error al obtener sesión:', error);
        setSession(null);
      }
    };

    const fetchPedidoDetalles = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      
      try {
        // Fetch order information
        const pedidoResponse = await fetch(`${API_BASE_URL}/pedido/${id}/detalles`);
        const orderData = await pedidoResponse.json();
        
        // Fetch product details
        const productosResponse = await fetch(`${API_BASE_URL}/pedido/${id}/detalles`);
        const productosData = await productosResponse.json();
        
        const productosFormateados = productosData.map(producto => ({
          id: producto.ID,
          nombre: producto.NOMBRE,
          categoria: producto.CATEGORIA,
          cantidad: parseInt(producto.CANTIDAD),
          precioCompra: parseFloat(producto.PRECIOUNITARIO),
          total: parseFloat(producto.TOTAL)
        }));
        
        const orderDetails = {
          id: id,
          fechaCreacion: orderData.fechaCreacion || new Date(),
          creadoPor: orderData.creadoPorNombre || orderData.solicitadoPor || "Usuario Admin",
          correo: orderData.creadaPor || orderData.email || "admin@ejemplo.com",
          organizacion: orderData.organizacion || "Sapitos 2.0",
          proveedor: { nombre: orderData.proveedor || "Proveedor" },
          descuentoAplicado: orderData.descuentoAplicado || 0,
          total: orderData.total || productosFormateados.reduce((acc, p) => acc + p.total, 0)
        };

        setProductos(productosFormateados);
        setPedido(orderDetails);
      } catch (error) {
        console.error("Error al obtener el pedido:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
    fetchPedidoDetalles();
  }, [id]);

  const exportToCSV = () => {
    if (!pedido || !productos.length) return;

    const headers = ['#', 'Producto', 'Categoría', 'Precio', 'Cantidad', 'Subtotal'];
    const data = productos.map((prod, idx) => [
      idx + 1,
      prod.nombre,
      prod.categoria,
      prod.precioCompra.toFixed(2),
      prod.cantidad,
      (prod.precioCompra * prod.cantidad).toFixed(2)
    ]);

    const subtotal = productos.reduce((acc, p) => acc + (p.precioCompra * p.cantidad), 0);
    
    data.push(['', '', '', '', 'Subtotal:', subtotal.toFixed(2)]);
    data.push(['', '', '', '', 'Descuento:', pedido.descuentoAplicado.toFixed(2)]);
    data.push(['', '', '', '', 'Impuesto:', '0.00']);
    data.push(['', '', '', '', 'Total:', pedido.total.toFixed(2)]);

    let csvContent = headers.join(',') + '\n';
    data.forEach(row => {
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pedido-${pedido.id}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className='card-body text-center py-5'>
        <Icon icon='mdi:loading' className='text-primary text-2xl animate-spin mb-3' />
        <p>Cargando detalles del pedido...</p>
      </div>
    );
  }

  if (!pedido || !productos || productos.length === 0) {
    return (
      <div className='card-body text-center py-5'>
        <p>No se encontraron datos del pedido.</p>
      </div>
    );
  }

  const subtotal = productos.reduce((acc, p) => acc + (p.precioCompra * p.cantidad), 0);

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-3">
          <div className="text-end">
            <p className="mb-0 small">Visualizado por: {session.nombre}</p>
            <p className="mb-0 small text-muted">Rol: {session.rol}</p>
          </div>
          <button
            onClick={exportToCSV}
            className='btn btn-success d-flex align-items-center'
          >
            <Icon icon='mdi:file-export-outline' className='me-2' />
            Exportar CSV
          </button>
        </div>
      </div>
      <div className='card'>
        <div className='card-body py-40'>
          <div className='row justify-content-center'>
            <div className='col-lg-8'>
              <div className='shadow-4 border radius-8'>
                <div className='p-20 d-flex flex-wrap justify-content-between gap-3 border-bottom'>
                  <div>
                    <h3 className='text-xl'>Pedido #{pedido.id}</h3>
                    <p className='mb-1 text-sm'>Fecha: {new Date(pedido.fechaCreacion).toLocaleDateString("es-MX")}</p>
                    <div className='mb-2'>
                      <p className='mb-1 fw-medium text-sm'>Información del Solicitante:</p>
                      <p className='mb-1 text-sm'>Nombre: {pedido.creadoPor}</p>
                      <p className='mb-0 text-sm'>Email: {pedido.correo}</p>
                      <p className='mb-0 text-sm'>Organización: {pedido.organizacion}</p>
                    </div>
                  </div>
                  <div>
                    <h6 className='mb-0'>Proveedor</h6>
                    <p className='text-sm mb-0'>{pedido.proveedor.nombre}</p>
                  </div>
                </div>
                <div className='py-28 px-20'>
                  <div className='table-responsive scroll-sm'>
                    <table className='table bordered-table text-sm'>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Producto</th>
                          <th>Categoría</th>
                          <th>Precio</th>
                          <th>Cantidad</th>
                          <th className='text-end'>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productos.map((prod, idx) => (
                          <tr key={prod.id || idx}>
                            <td>{idx + 1}</td>
                            <td>{prod.nombre}</td>
                            <td>{prod.categoria}</td>
                            <td>${prod.precioCompra.toFixed(2)}</td>
                            <td>{prod.cantidad}</td>
                            <td className='text-end'>${(prod.precioCompra * prod.cantidad).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className='d-flex flex-wrap justify-content-between gap-3 mt-4'>
                    <div>
                      <p className='text-sm mb-0'>Gracias por tu pedido</p>
                    </div>
                    <div>
                      <table className='text-sm'>
                        <tbody>
                          <tr>
                            <td className='pe-64'>Subtotal:</td>
                            <td className='pe-16'>${subtotal.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td className='pe-64'>Descuento:</td>
                            <td className='pe-16'>-${pedido.descuentoAplicado.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td className='pe-64 border-bottom pb-4'>Impuesto:</td>
                            <td className='pe-16 border-bottom pb-4'>$0.00</td>
                          </tr>
                          <tr>
                            <td className='pe-64 pt-4 fw-semibold'>Total:</td>
                            <td className='pe-16 pt-4 fw-semibold'>${pedido.total.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className='mt-64 text-center'>
                    <p className='text-secondary-light text-sm fw-semibold'>¡Gracias por tu compra!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoicePreview;