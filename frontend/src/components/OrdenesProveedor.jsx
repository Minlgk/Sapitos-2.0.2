import { useState } from "react";
import { Icon } from "@iconify/react";

const OrdenesProveedor = () => {
  // Datos hardcodeados de los productos relacionados con los pedidos
  const datosProductos = [
    {
      "id": 1,
      "proveedor": "ProveeTex",
      "nombre": "Playera Básica S",
      "categoria": "Playera",
      "stockActual": 120,
      "stockMinimo": 30,
      "fechaUltimaCompra": "2025-04-01",
      "fechaUltimaVenta": null,
      "precioCompra": null,
      "precioVenta": null
    },
    {
      "id": 2,
      "proveedor": "ProveeTex",
      "nombre": "Playera Básica S",
      "categoria": "Playera",
      "stockActual": 120,
      "stockMinimo": 30,
      "fechaUltimaCompra": "2025-04-01",
      "fechaUltimaVenta": "2025-04-20",
      "precioCompra": "50",
      "precioVenta": "100"
    },
    {
      "id": 3,
      "proveedor": "ProveeTex",
      "nombre": "Playera Básica M",
      "categoria": "Playera",
      "stockActual": 100,
      "stockMinimo": 25,
      "fechaUltimaCompra": "2025-04-01",
      "fechaUltimaVenta": "2025-04-19",
      "precioCompra": "50",
      "precioVenta": "100"
    },
    {
      "id": 4,
      "proveedor": "ProveeTex",
      "nombre": "Playera Básica G",
      "categoria": "Playera",
      "stockActual": 80,
      "stockMinimo": 20,
      "fechaUltimaCompra": "2025-04-01",
      "fechaUltimaVenta": "2025-04-18",
      "precioCompra": "50",
      "precioVenta": "100"
    }
  ];

  // Datos hardcodeados para los pedidos pendientes basados en los productos
  const pedidosHardcoded = [
    {
      id: "#PED-01",
      idOriginal: "PED-01",
      cliente: "Tienda Central",
      fecha: "28/04/2025",
      cantidad: 30,
      producto: "Playera Básica S",
      proveedor: "ProveeTex"
    },
    {
      id: "#PED-02",
      idOriginal: "PED-02",
      cliente: "Tienda Norte",
      fecha: "29/04/2025",
      cantidad: 25,
      producto: "Playera Básica M",
      proveedor: "ProveeTex"
    },
    {
      id: "#PED-03",
      idOriginal: "PED-03",
      cliente: "Tienda Sur",
      fecha: "30/04/2025",
      cantidad: 20,
      producto: "Playera Básica G",
      proveedor: "ProveeTex"
    }
  ];

  const [pedidos, setPedidos] = useState(pedidosHardcoded);
  const [loading, setLoading] = useState(false);

  const aceptarPedido = (pedidoId) => {
    // Simulamos la confirmación y la eliminación del pedido de la lista
    if (window.confirm("¿Confirmar envío? Al aceptar, el estado cambiará a 'En Reparto'")) {
      setPedidos(pedidos.filter(pedido => pedido.idOriginal !== pedidoId));
      alert("¡Listo! El pedido está ahora En Reparto");
    }
  };

  const rechazarPedido = (pedidoId) => {
    // Simulamos la confirmación y la eliminación del pedido de la lista
    if (window.confirm("¿Seguro que desea rechazar este pedido? Esta acción no se puede deshacer.")) {
      setPedidos(pedidos.filter(pedido => pedido.idOriginal !== pedidoId));
      alert("Pedido rechazado correctamente");
    }
  };

  return (
    <>
      {/* Sección de Pedidos Pendientes */}
      <div className="card h-100 p-0 radius-12">
        <div className="card-header d-flex justify-content-between align-items-center py-16 px-24">
          <div className="d-flex align-items-center gap-3">
            <Icon icon="mdi:clipboard-list-outline" className="text-primary me-2 text-xl" />
          <span className="text-md fw-medium mb-0">Pedidos Pendientes</span>
          </div>
        </div>
        
        <div className="card-body p-24">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : pedidos.length > 0 ? (
            <div className="table-responsive scroll-sm">
              <table className="table bordered-table mb-0">
                  <thead>
                    <tr>
                      <th>ID Pedido</th>
                      <th>Cliente</th>
                      <th>Producto</th>
                      <th>Fecha</th>
                      <th>Cantidad</th>
                    <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidos.map((pedido) => (
                       <tr key={pedido.idOriginal}>
                         <td className="align-middle">{pedido.id}</td>
                      <td className="align-middle">
                        <div className="d-flex flex-column">
                          <span className="fw-medium">{pedido.cliente}</span>
                          <small className="text-muted">{pedido.email}</small>
                        </div>
                      </td>
                         <td className="align-middle">{pedido.producto}</td>
                         <td className="align-middle">{pedido.fecha}</td>
                      <td className="align-middle fw-medium">${pedido.cantidad}</td>
                      <td className="align-middle">
                        <span className="px-12 py-1 rounded-pill fw-medium text-xs bg-warning-focus text-warning-main">
                          Pendiente
                        </span>
                      </td>
                      <td className="align-middle">
                        <div className="d-flex gap-2">
                          <button
                            onClick={() => aceptarPedido(pedido.idOriginal)}
                            className='w-32-px h-32-px bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center'
                            style={{ border: 'none' }}
                            title="Aceptar pedido"
                          >
                            <Icon icon='mdi:check-bold' width="20" height="20" />
                          </button>
                          <button
                            onClick={() => rechazarPedido(pedido.idOriginal)}
                            className='w-32-px h-32-px bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center'
                            style={{ border: 'none' }}
                            title="Rechazar pedido"
                          >
                            <Icon icon='mingcute:close-circle-line' width="20" height="20" />
                          </button>
                          <button 
                            onClick={() => showDetails(pedido)}
                            className='w-32-px h-32-px bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center'
                            style={{ border: 'none' }}
                            title="Ver detalles"
                          >
                            <Icon icon='iconamoon:eye-light' width="20" height="20" />
                          </button>
                        </div>
                         </td>
                       </tr>
                    ))}
                   </tbody>
              </table>
            </div>
          ) : (
            <div className="alert alert-info mb-0 text-center py-3">
              <div className="d-flex flex-column align-items-center gap-2">
                <Icon icon="mdi:clipboard-text-off-outline" className="text-muted text-4xl" />
              No tienes pedidos pendientes por aceptar
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Sección de Inventario */}
      <div className="card h-100 p-0 radius-12 mt-4">
         <div className="card-header bg-success text-white">
           <span className="text-md fw-medium mb-0">Inventario de Productos</span>
         </div>
        <div className="card-body p-24">
           <div className="table-responsive">
             <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Proveedor</th>
                    <th>Stock Actual</th>
                    <th>Stock Mínimo</th>
                    <th>Última Compra</th>
                    <th>Última Venta</th>
                    <th>Precio Compra</th>
                    <th>Precio Venta</th>
                  </tr>
                </thead>
                <tbody>
                  {datosProductos.map((producto) => (
                    <tr key={producto.id}>
                      <td className="align-middle">{producto.nombre}</td>
                      <td className="align-middle">{producto.categoria}</td>
                      <td className="align-middle">{producto.proveedor}</td>
                      <td className="align-middle">{producto.stockActual}</td>
                      <td className="align-middle">{producto.stockMinimo}</td>
                      <td className="align-middle">{producto.fechaUltimaCompra}</td>
                      <td className="align-middle">{producto.fechaUltimaVenta || 'N/A'}</td>
                      <td className="align-middle">{producto.precioCompra !== null ? `$${producto.precioCompra}` : 'N/A'}</td>
                      <td className="align-middle">{producto.precioVenta !== null ? `$${producto.precioVenta}` : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
         </div>
       </div>
    </>
  );
};

export default OrdenesProveedor;