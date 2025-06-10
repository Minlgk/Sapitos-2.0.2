const { connection } = require("../config/db");
const { generarNotificacion } = require("./alertaController"); 

const getPedido = async (req, res) => {
  try {
    const query = `
      SELECT
        o.Orden_ID as ID,
        o.Creado_por_ID as CREADA_POR,
        u.Correo as CORREO_CREADOR,
        u.Nombre as CREADO_POR_NOMBRE,
        o.Organizacion,
        o.FechaCreacion as FECHACREACION,
        o.FechaAceptacion as FECHAACEPTACION,
        o.FechaLimitePago as FECHAESTIMAPAGO,
        o.FechaEstimadaEntrega as FECHAESTIMAENTREGA,
        o.FechaEntrega as FECHAENTREGA,
        o.EntregaATiempo as ENTREGAATIEMPO,
        o.Estado as ESTATUS,
        o.Total as TOTAL,
        mp.Nombre as METODOPAGO,
        o.DescuentoAplicado as DESCUENTOAPLICADO,
        o.TiempoReposicion as TIEMPOREPOSICION,
        o.TiempoEntrega as TIEMPOENTREGA,
        o.TipoOrden
      FROM Ordenes2 o
      LEFT JOIN Usuario2 u ON o.Creado_por_ID = u.Usuario_ID
      LEFT JOIN MetodoPago2 mp ON o.MetodoPago_ID = mp.MetodoPago_ID
      ORDER BY o.FechaCreacion DESC
    `;

    connection.exec(query, [], (err, result) => {
      if (err) {
        console.error("Error al obtener los pedidos:", err);
        return res.status(500).json({ error: "Error al obtener los pedidos", detalle: err.message });
      }

      const formatted = (Array.isArray(result) ? result : []).map(pedido => ({
        id: pedido.ID,
        creadaPor: pedido.CORREO_CREADOR,
        creadoPorNombre: pedido.CREADO_POR_NOMBRE,
        organizacion: pedido.Organizacion,
        tipoOrden: pedido.TipoOrden,
        fechaCreacion: pedido.FECHACREACION,
        fechaAceptacion: pedido.FECHAACEPTACION,
        fechaEstimaPago: pedido.FECHAESTIMAPAGO,
        fechaEstimaEntrega: pedido.FECHAESTIMAENTREGA,
        fechaEntrega: pedido.FECHAENTREGA,
        entregaATiempo: pedido.ENTREGAATIEMPO,
        estatus: pedido.ESTATUS,
        total: pedido.TOTAL,
        metodoPago: pedido.METODOPAGO,
        descuentoAplicado: pedido.DESCUENTOAPLICADO,
        tiempoReposicion: pedido.TIEMPOREPOSICION,
        tiempoEntrega: pedido.TIEMPOENTREGA
      }));

      res.status(200).json(formatted);
    });
  } catch (error) {
    console.error("Error general:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const insertPedido = async (req, res) => {
  let conn;
  try {
    const { 
      creadoPorId,
      organizacion,
      productos,
      total,
      metodoPagoId = 1,
      descuentoAplicado = 0,
      tipoOrden = 'Compra'
    } = req.body;

    // Validaciones básicas
    if (!creadoPorId || !organizacion || !productos?.length || total === undefined) {
      return res.status(400).json({ 
        error: "Datos incompletos para crear el pedido",
        detalles: {
          creadoPorId: !creadoPorId ? "Faltante" : "OK",
          organizacion: !organizacion ? "Faltante" : "OK", 
          productos: !productos?.length ? "Faltante o vacío" : "OK",
          total: total === undefined ? "Faltante" : "OK"
        }      });
    }

    // Validar que el usuario existe
    const userCheckQuery = `SELECT 1 FROM Usuario2 WHERE Usuario_ID = ?`;
    const userResult = await new Promise((resolve, reject) => {
      connection.exec(userCheckQuery, [creadoPorId], (err, result) => {
        if (err) {
          console.error("Error al verificar usuario:", err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    if (!userResult || userResult.length === 0) {
      return res.status(400).json({ 
        error: "El usuario especificado no existe",
        creadoPorId: creadoPorId
      });
    }

    // Validar que el método de pago existe
    const pagoCheckQuery = `SELECT 1 FROM MetodoPago2 WHERE MetodoPago_ID = ?`;
    const pagoResult = await new Promise((resolve, reject) => {
      connection.exec(pagoCheckQuery, [metodoPagoId], (err, result) => {
        if (err) {
          console.error("Error al verificar método de pago:", err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    if (!pagoResult || pagoResult.length === 0) {
      return res.status(400).json({ 
        error: "El método de pago especificado no existe",
        metodoPagoId: metodoPagoId
      });
    }    // Usamos la conexión de pool existente
    conn = connection;

    const insertOrdenQuery = `
      INSERT INTO Ordenes2 (
        Creado_por_ID, 
        TipoOrden,
        Organizacion, 
        FechaCreacion, 
        Estado, 
        Total, 
        MetodoPago_ID, 
        DescuentoAplicado
      ) VALUES (?, ?, ?, CURRENT_DATE, 'Pendiente', ?, ?, ?)
    `;

    const ordenId = await new Promise((resolve, reject) => {
      conn.exec(insertOrdenQuery, 
        [creadoPorId, tipoOrden, organizacion, total, metodoPagoId, descuentoAplicado], 
        (err, result) => {
          if (err) {
            console.error("Error al insertar orden:", err);
            reject(err);
          } else {            conn.exec("SELECT TOP 1 Orden_ID FROM Ordenes2 ORDER BY Orden_ID DESC", [], (err2, result2) => {
              if (err2) {
                console.error("Error al obtener ID de orden:", err2);
                reject(err2);              } else {
                const ordenId = result2[0]?.ORDEN_ID;
                resolve(ordenId);
              }
            });
          }
        }
      );
    });    if (!ordenId) {
      console.error("No se pudo obtener el ID de la orden creada");
      throw new Error("No se pudo obtener el ID de la orden creada");
    }

    // Verificar que la orden existe en la base de datos
    const verificarOrdenQuery = "SELECT 1 FROM Ordenes2 WHERE Orden_ID = ?";
    const ordenResult = await new Promise((resolve, reject) => {
      conn.exec(verificarOrdenQuery, [ordenId], (err, result) => {
        if (err) {
          console.error("Error al verificar la existencia de la orden:", err);
          reject(err);        } else {
          resolve(result);
        }
      });
    });const ordenExiste = ordenResult && ordenResult.length > 0;
    if (!ordenExiste) {
      console.error("La orden fue creada pero no se encontró en la base de datos");
      throw new Error("La orden fue creada pero no se encontró en la base de datos");
    }

    let productosInsertados = 0;
    const erroresProductos = [];

    // Procesar productos secuencialmente para mejor control de errores
    for (let i = 0; i < productos.length; i++) {
      const producto = productos[i];
        try {
        
        // Validar que el artículo existe
        const checkArticuloQuery = `SELECT 1 FROM Articulo2 WHERE Articulo_ID = ?`;
        const articuloResult = await new Promise((resolve, reject) => {
          conn.exec(checkArticuloQuery, [producto.articuloId], (err, result) => {
            if (err) {
              console.error(`Error al verificar artículo ${producto.articuloId}:`, err);
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
        
        if (!articuloResult || articuloResult.length === 0) {
          erroresProductos.push(`El artículo ${producto.articuloId} no existe en la base de datos`);
          continue;
        }
        
        // Buscar el Location_ID
        const getLocationIdQuery = `SELECT Location_ID FROM Location2 WHERE Nombre = ?`;
        const locationResult = await new Promise((resolve, reject) => {
          conn.exec(getLocationIdQuery, [organizacion], (err, result) => {
            if (err) {
              console.error(`Error al buscar Location_ID para ${organizacion}:`, err);
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
        
        if (!locationResult || locationResult.length === 0) {
          erroresProductos.push(`La ubicación ${organizacion} no existe en la base de datos`);
          continue;
        }
        
        const locationId = locationResult[0].LOCATION_ID;
          // Buscar inventario existente
        const buscarInventarioQuery = `
          SELECT TOP 1 Inventario_ID 
          FROM Inventario2
          WHERE Articulo_ID = ? AND Location_ID = ?
        `;

        const inventarioResult = await new Promise((resolve, reject) => {
          conn.exec(buscarInventarioQuery, [producto.articuloId, locationId], (err, result) => {
            if (err) {
              console.error(`Error al buscar inventario para producto ${producto.articuloId}:`, err);
              reject(err);            } else {
              resolve(result);
            }
          });
        });

        let inventarioId;
        
        if (!inventarioResult || inventarioResult.length === 0) {
          // Crear nuevo inventario
          const createInventarioQuery = `
            INSERT INTO Inventario2 (
              Articulo_ID, 
              Location_ID, 
              StockActual, 
              StockMinimo, 
              StockRecomendado, 
              FechaUltimaImportacion
            ) VALUES (?, ?, 1000, 10, 50, CURRENT_DATE)
          `;
          
          await new Promise((resolve, reject) => {
            conn.exec(createInventarioQuery, [producto.articuloId, locationId], (err, result) => {
              if (err) {
                console.error(`Error al crear inventario para artículo ${producto.articuloId}:`, err);
                reject(err);
              } else {
                resolve(result);
              }
            });
          });
            // Obtener el ID generado
          const newInventarioResult = await new Promise((resolve, reject) => {
            conn.exec("SELECT TOP 1 Inventario_ID FROM Inventario2 ORDER BY Inventario_ID DESC", [], (err, result) => {
              if (err) {
                console.error("Error al obtener ID del nuevo inventario:", err);
                reject(err);
              } else {
                resolve(result);
              }
            });
          });          
          inventarioId = newInventarioResult[0]?.INVENTARIO_ID;        } else {
          inventarioId = inventarioResult[0].INVENTARIO_ID;
        }
        
        // Insertar producto en orden
        const insertProductoQuery = `
          INSERT INTO OrdenesProductos2 (
            Orden_ID, 
            Inventario_ID, 
            Cantidad, 
            PrecioUnitario
          ) VALUES (?, ?, ?, ?)
        `;

        await new Promise((resolve, reject) => {
          conn.exec(insertProductoQuery, 
            [ordenId, inventarioId, producto.cantidad, producto.precio], 
            (err, result) => {
              if (err) {
                console.error(`Error al insertar producto ${producto.articuloId}:`, err);
                reject(err);              } else {
                productosInsertados++;
                resolve(result);
              }
            }
          );
        });

      } catch (error) {
        console.error(`Error procesando producto ${producto.articuloId}:`, error);
        erroresProductos.push(`Error en producto ${producto.articuloId}: ${error.message}`);
      }
    }    if (productosInsertados === 0) {
      console.error("No se pudo insertar ningún producto");
      return res.status(400).json({
        error: "No se pudo insertar ningún producto",
        detalles: erroresProductos
      });
    }    console.log("Pedido procesado exitosamente, enviando respuesta...");

    const response = {
      message: "Pedido creado exitosamente",
      ordenId: ordenId,
      total: total,
      productosInsertados,
      totalProductos: productos.length
    };

    if (erroresProductos.length > 0) {
      response.advertencias = erroresProductos;
    }

    console.log("Pedido creado exitosamente:", response);

    // Después de crear el pedido exitosamente, generar notificación
    try {
      // Obtener el nombre del usuario que creó el pedido para la notificación
      const getUserQuery = `SELECT Nombre FROM Usuario2 WHERE Usuario_ID = ?`;
      const userResult = await new Promise((resolve, reject) => {
        conn.exec(getUserQuery, [creadoPorId], (err, result) => {
          if (err) {
            console.error("Error al obtener usuario:", err);
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
      
      const creadorNombre = userResult?.[0]?.NOMBRE || "Usuario";
      
      // Por defecto usamos ubicación ID 1
      const locationId = 1;
      
      await generarNotificacion(
        `Nueva orden creada por ${creadorNombre} para ${organizacion}. Total: $${total}`,
        `Nueva orden creada`,
        'primary',
        locationId,
        ordenId  // Este valor debe estar disponible después de crear el pedido
      );
      
      console.log(`Notificación generada para el pedido`);
    } catch (notifError) {
      // No bloqueamos la creación del pedido si falla la notificación
      console.error("Error al generar notificación:", notifError);
    }

    res.status(201).json(response);
  } catch (error) {
    // SAP HANA handles transactions automatically - no manual rollback needed
    console.error("Error general al crear pedido:", error);
    console.error("Stack trace:", error.stack);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    res.status(500).json({ 
      error: "Error al crear el pedido", 
      detalle: error.message,
      codigo: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const deletePedido = async (req, res) => {
  const { id } = req.params;
  
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: "ID de pedido inválido" });
  }
  try {
    // SAP HANA handles transactions automatically
    
    // Verificar que el pedido existe
    const pedidoResult = await new Promise((resolve, reject) => {
      connection.exec('SELECT Orden_ID FROM Ordenes2 WHERE Orden_ID = ?', [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    if (!pedidoResult || pedidoResult.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }
    
    // Primero eliminar los productos asociados
    await new Promise((resolve, reject) => {
      connection.exec('DELETE FROM OrdenesProductos2 WHERE Orden_ID = ?', [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    // Luego eliminar el pedido
    await new Promise((resolve, reject) => {
      connection.exec('DELETE FROM Ordenes2 WHERE Orden_ID = ?', [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    res.status(200).json({ message: "Pedido eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar pedido:", error);
    res.status(500).json({ error: "Error al eliminar el pedido" });
  }
};

const updatePedido = async (req, res) => {
  const { id } = req.params;
  const { estado, ...datos } = req.body;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: "ID de pedido inválido" });
  }

  try {
    if (estado) {
      return res.status(400).json({ 
        error: "Use las rutas específicas para cambiar el estado (/aprobar, /entregar)" 
      });
    }

    const campos = [];
    const valores = [];
    
    const campoMap = {
      organizacion: 'Organizacion',
      total: 'Total',
      descuentoAplicado: 'DescuentoAplicado',
      tiempoReposicion: 'TiempoReposicion'
    };
    
    for (const [key, value] of Object.entries(datos)) {
      if (value !== undefined && value !== null) {
        const campoDb = campoMap[key] || key;
        campos.push(`${campoDb} = ?`);
        valores.push(value);
      }
    }
    
    if (campos.length === 0) {
      return res.status(400).json({ error: "No hay datos para actualizar" });
    }

    const query = `UPDATE Ordenes2 SET ${campos.join(', ')} WHERE Orden_ID = ?`;
    const result = await connection.exec(query, [...valores, id]);
    
    res.status(200).json({ message: "Pedido actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar pedido:", error);
    res.status(500).json({ error: "Error al actualizar el pedido" });
  }
};

const getProveedores = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT
        l.Nombre as NOMBRE,
        COUNT(f.Articulo_ID) as TOTAL_PRODUCTOS
      FROM Location2 l
      INNER JOIN Fabricacion2 f ON l.Location_ID = f.Location_ID
      INNER JOIN Articulo2 a ON f.Articulo_ID = a.Articulo_ID
      WHERE l.Tipo = 'Proveedor' OR l.Tipo = 'Fabrica'
      GROUP BY l.Location_ID, l.Nombre
      ORDER BY l.Nombre
    `;
    
    connection.exec(query, [], (err, result) => {
      if (err) {
        console.error("Error al obtener proveedores:", err);
        return res.status(500).json({ error: "Error al obtener proveedores", detalle: err.message });
      }
      
      const proveedoresFormateados = (result || []).map(proveedor => ({
        nombre: proveedor.NOMBRE,
        totalProductos: proveedor.TOTAL_PRODUCTOS || 0
      }));
      
      res.status(200).json(proveedoresFormateados);
    });
  } catch (error) {
    console.error("Error general:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const getProductosPorProveedor = async (req, res) => {
  const { nombreProveedor } = req.params;
  
  if (!nombreProveedor) {
    return res.status(400).json({ error: "Nombre de proveedor requerido" });
  }

  try {
    const query = `
      SELECT 
        a.Articulo_ID as ID,
        a.Nombre as NOMBRE,
        a.Categoria as CATEGORIA,
        i.StockActual as STOCKACTUAL,
        a.PrecioProveedor as PRECIOCOMPRA,
        a.PrecioVenta as PRECIOVENTA,
        a.Temporada as TEMPORADA,
        i.FechaUltimaImportacion as FECHAULTIMACOMPRA,
        l.Nombre as PROVEEDOR
      FROM Articulo2 a
      INNER JOIN Fabricacion2 f ON a.Articulo_ID = f.Articulo_ID
      INNER JOIN Location2 l ON f.Location_ID = l.Location_ID
      INNER JOIN Inventario2 i ON a.Articulo_ID = i.Articulo_ID AND l.Location_ID = i.Location_ID
      WHERE l.Nombre = ?
      ORDER BY a.Nombre
    `;
    
    connection.exec(query, [decodeURIComponent(nombreProveedor)], (err, result) => {
      if (err) {
        console.error("Error al obtener productos:", err);
        return res.status(500).json({ error: "Error al obtener productos", detalle: err.message });
      }
      
      const productosFormateados = (result || []).map(producto => ({
        id: producto.ID,
        articuloId: producto.ID,
        nombre: producto.NOMBRE,
        categoria: producto.CATEGORIA,
        stockActual: producto.STOCKACTUAL,
        precioCompra: producto.PRECIOCOMPRA,
        precioVenta: producto.PRECIOVENTA,
        temporada: producto.TEMPORADA,
        fechaUltimaCompra: producto.FECHAULTIMACOMPRA,
        proveedor: producto.PROVEEDOR,
        precio: producto.PRECIOCOMPRA
      }));
      
      res.status(200).json(productosFormateados);
    });
  } catch (error) {
    console.error("Error general:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// Aprobar pedido (para proveedores)
const aprobarPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { fechaAceptacion, fechaEstimadaEntrega, fechaPago } = req.body;

    // Validar que exista el pedido
    const checkOrderQuery = "SELECT * FROM Ordenes2 WHERE Orden_ID = ?";
    const orderResult = await new Promise((resolve, reject) => {
      connection.exec(checkOrderQuery, [id], (err, result) => {
        if (err) {
          console.error("Error al verificar pedido:", err);
          reject(err);
          return;
        }
        resolve(result);
      });
    });

    if (!orderResult || orderResult.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    // Actualizar el pedido a estado "Aprobado"
    const updateQuery = `
      UPDATE Ordenes2 SET 
        Estado = 'Aprobado', 
        FechaAceptacion = ?, 
        FechaEstimadaEntrega = ?,
        FechaLimitePago = ?
      WHERE Orden_ID = ?
    `;

    await new Promise((resolve, reject) => {
      connection.exec(
        updateQuery, 
        [
          fechaAceptacion || new Date().toISOString().split("T")[0], 
          fechaEstimadaEntrega || null,
          fechaPago || null,
          id
        ], 
        (err, result) => {
          if (err) {
            console.error("Error al aprobar pedido:", err);
            reject(err);
            return;
          }
          resolve(result);
        }
      );
    });

    // Después de aprobar el pedido exitosamente, generar notificación
    try {
      // Obtener información del pedido para la notificación
      const getPedidoQuery = `
        SELECT o.*, u.Nombre as CreadorNombre 
        FROM Ordenes2 o
        LEFT JOIN Usuario2 u ON o.Creado_por_ID = u.Usuario_ID
        WHERE o.Orden_ID = ?
      `;
      
      const pedidoInfo = await new Promise((resolve, reject) => {
        connection.exec(getPedidoQuery, [id], (err, result) => {
          if (err) {
            console.error("Error al obtener info del pedido:", err);
            reject(err);
          } else {
            resolve(result[0]);
          }
        });
      });
      
      if (pedidoInfo) {
        // Por defecto usamos ubicación ID 1 o la del creador si está disponible
        const locationId = pedidoInfo.LOCATION_ID || 1;
        
        await generarNotificacion(
          `Orden aprobada para ${pedidoInfo.ORGANIZACION}. Entrega estimada: ${fechaEstimadaEntrega || 'No especificada'}`,
          `Orden aprobada`,
          'success',
          locationId,
          id
        );
        
        console.log(`Notificación generada para la aprobación del pedido #${id}`);
      }
    } catch (notifError) {
      // No bloqueamos la aprobación del pedido si falla la notificación
      console.error("Error al generar notificación:", notifError);
    }

    res.json({ message: "Pedido aprobado correctamente" });
  } catch (error) {
    console.error("Error general al aprobar pedido:", error);
    res.status(500).json({ error: "Error al aprobar el pedido", detalle: error.message });
  }
};

// Marcar pedido como entregado/enviado (para proveedores)
const entregarPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { fechaEntrega } = req.body;

    // Validar que exista el pedido
    const checkOrderQuery = "SELECT * FROM Ordenes2 WHERE Orden_ID = ?";
    const orderResult = await new Promise((resolve, reject) => {
      connection.exec(checkOrderQuery, [id], (err, result) => {
        if (err) {
          console.error("Error al verificar pedido:", err);
          reject(err);
          return;
        }
        resolve(result);
      });
    });

    if (!orderResult || orderResult.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const pedido = orderResult[0];
    
    // Validar que el pedido esté en estado Aprobado o En Reparto
    if (pedido.ESTADO !== 'Aprobado' && pedido.ESTADO !== 'En Reparto') {
      return res.status(400).json({ 
        error: "Solo se pueden entregar pedidos en estado Aprobado o En Reparto",
        estado_actual: pedido.ESTADO
      });
    }

    // Calcular si la entrega fue a tiempo
    let entregaATiempo = false;
    if (pedido.FECHAESTIMADAENTREGA) {
      const fechaEstimadaEntrega = new Date(pedido.FECHAESTIMADAENTREGA);
      const fechaEntregaReal = fechaEntrega ? new Date(fechaEntrega) : new Date();
      entregaATiempo = fechaEntregaReal <= fechaEstimadaEntrega;
    }

    // Actualizar el pedido a estado "Completado"
    const updateQuery = `
      UPDATE Ordenes2 SET 
        Estado = 'Completado', 
        FechaEntrega = ?,
        EntregaATiempo = ?
      WHERE Orden_ID = ?
    `;

    await new Promise((resolve, reject) => {
      connection.exec(
        updateQuery, 
        [
          fechaEntrega || new Date().toISOString().split("T")[0],
          entregaATiempo ? 1 : 0,
          id
        ], 
        (err, result) => {
          if (err) {
            console.error("Error al completar pedido:", err);
            reject(err);
            return;
          }
          resolve(result);
        }
      );
    });

    // Después de entregar el pedido exitosamente, generar notificación
    try {
      // Obtener información del pedido para la notificación
      const getPedidoQuery = `
        SELECT o.*, u.Nombre as CreadorNombre 
        FROM Ordenes2 o
        LEFT JOIN Usuario2 u ON o.Creado_por_ID = u.Usuario_ID
        WHERE o.Orden_ID = ?
      `;
      
      const pedidoInfo = await new Promise((resolve, reject) => {
        connection.exec(getPedidoQuery, [id], (err, result) => {
          if (err) {
            console.error("Error al obtener info del pedido:", err);
            reject(err);
          } else {
            resolve(result[0]);
          }
        });
      });
      
      if (pedidoInfo) {
        // Por defecto usamos ubicación ID 1 o la del creador si está disponible
        const locationId = pedidoInfo.LOCATION_ID || 1;
        const tipoNotificacion = entregaATiempo ? 'success' : 'warning';
        
        await generarNotificacion(
          `Orden completada para ${pedidoInfo.ORGANIZACION}. Entrega ${entregaATiempo ? 'a tiempo' : 'con retraso'}.`,
          `Orden completada`,
          tipoNotificacion,
          locationId,
          id
        );
        
        console.log(`Notificación generada para la entrega del pedido #${id}`);
      }
    } catch (notifError) {
      // No bloqueamos la entrega del pedido si falla la notificación
      console.error("Error al generar notificación:", notifError);
    }

    res.json({ 
      message: "Pedido entregado correctamente",
      entregaATiempo
    });
  } catch (error) {
    console.error("Error general al entregar pedido:", error);
    res.status(500).json({ error: "Error al entregar el pedido", detalle: error.message });
  }
};

// De En Reparto a Completado (para admin)
const actualizarEstatus = async (req, res) => {
  const { id } = req.params;
  const { estatus } = req.body;
  
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: "ID de pedido inválido" });
  }

  if (!estatus) {
    return res.status(400).json({ error: "Estatus requerido" });
  }

  try {
    // Verificar que el pedido existe
    const pedidoResult = await new Promise((resolve, reject) => {
      connection.exec(`SELECT Estado FROM Ordenes2 WHERE Orden_ID = ?`, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const pedido = pedidoResult[0];
    if (!pedido) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    // Actualizar el estatus
    await new Promise((resolve, reject) => {
      connection.exec(`
        UPDATE Ordenes2 SET Estado = ? WHERE Orden_ID = ?
      `, [estatus, id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    res.status(200).json({ 
      message: `Pedido ${id} actualizado a estatus: ${estatus}`,
      estatus: estatus
    });

  } catch (error) {
    console.error("Error al actualizar estatus:", error);
    res.status(500).json({ error: "Error al actualizar el estatus del pedido" });
  }
};
const getPedidosProveedor = async (req, res) => {
  const { correo } = req.params;
  
  if (!correo) {
    return res.status(400).json({ error: "Correo del proveedor requerido" });
  }

  try {
    connection.exec(`
      SELECT 
        o.Orden_ID as ID,
        o.Organizacion,
        o.FechaCreacion,
        o.FechaAceptacion,
        o.FechaEstimadaEntrega,
        o.FechaEntrega,
        o.Estado,
        o.Total,
        u.Nombre as SolicitadoPor
      FROM Ordenes2 o
      INNER JOIN Usuario2 u ON o.Creado_por_ID = u.Usuario_ID
      WHERE o.Organizacion = (
        SELECT l.Nombre 
        FROM Location2 l 
        INNER JOIN Usuario2 u2 ON l.Location_ID = u2.Location_ID 
        WHERE u2.Correo = ?
      )
      ORDER BY o.FechaCreacion DESC
    `, [correo], (err, result) => {
      if (err) {
        console.error("Error al obtener pedidos del proveedor:", err);
        return res.status(500).json({ error: "Error al obtener pedidos" });
      }
      res.status(200).json(result || []);
    });
  } catch (error) {
    console.error("Error al obtener pedidos del proveedor:", error);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
};


// invoicePreview
const getDetallesPedido = async (req, res) => {
  const { id } = req.params;
  
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: "ID de pedido inválido" });
  }

  try {
    connection.exec(`
      SELECT 
        a.Articulo_ID as ID,
        a.Nombre as NOMBRE,
        a.Categoria as CATEGORIA,
        op.Cantidad as CANTIDAD,
        op.PrecioUnitario as PRECIOUNITARIO,
        (op.Cantidad * op.PrecioUnitario) as TOTAL
      FROM OrdenesProductos2 op
      INNER JOIN Inventario2 i ON op.Inventario_ID = i.Inventario_ID
      INNER JOIN Articulo2 a ON i.Articulo_ID = a.Articulo_ID
      WHERE op.Orden_ID = ?
      ORDER BY a.Nombre
    `, [id], (err, result) => {
      if (err) {
        console.error("Error al obtener detalles del pedido:", err);
        return res.status(500).json({ error: "Error al obtener detalles" });
      }
      res.status(200).json(result || []);
    });
  } catch (error) {
    console.error("Error al obtener detalles del pedido:", error);
    res.status(500).json({ error: "Error al obtener detalles" });
  }
};



// Recibir pedido y agregar al inventario (para admin)
const enviarAInventario = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: "ID de pedido inválido" });
  }
  try {
    const mainWarehouseQuery = `SELECT TOP 1 Location_ID, Nombre FROM Location2 WHERE Tipo = 'Oficina'`;
    const mainWarehouseResult = await new Promise((resolve, reject) => {
      connection.exec(mainWarehouseQuery, [], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    if (!mainWarehouseResult || mainWarehouseResult.length === 0) {
      return res.status(500).json({ error: "Almacén principal (Oficina) no configurado o no encontrado. Asegúrese de que existe una ubicación con Tipo = 'Oficina'." });
    }
    const mainWarehouseLocationId = mainWarehouseResult[0].LOCATION_ID;
    const mainWarehouseNombre = mainWarehouseResult[0].NOMBRE;

    const pedidoResult = await new Promise((resolve, reject) => {
      connection.exec(`SELECT Estado FROM Ordenes2 WHERE Orden_ID = ?`, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const pedido = pedidoResult[0];
    if (!pedido) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const estado = pedido?.ESTADO || pedido?.estado || pedido?.Estado;
    if (estado !== 'Completado') {
      return res.status(400).json({
        error: `Solo se pueden enviar al inventario pedidos Completados. Estado actual: ${estado}`
      });
    }

    console.log("Ubicación de destino (Almacén Principal):", { Location_ID: mainWarehouseLocationId, Nombre: mainWarehouseNombre });

    const checkOrderProductsQuery = `SELECT COUNT(*) as count FROM OrdenesProductos2 WHERE Orden_ID = ?`;
    const orderProductsCount = await new Promise((resolve, reject) => {
      connection.exec(checkOrderProductsQuery, [id], (err, result) => {
        if (err) {
          console.error("Error al verificar productos del pedido:", err);
          reject(err);
        } else {
          const count = result[0]?.COUNT || result[0]?.count || 0;
          console.log(`Pedido ${id} tiene ${count} productos en OrdenesProductos2`);
          resolve(count);
        }
      });
    });

    if (orderProductsCount === 0) {
      return res.status(400).json({ error: "El pedido no tiene productos asociados en la tabla OrdenesProductos2" });
    }

    const productosDelPedido = await new Promise((resolve, reject) => {
      connection.exec(`
        SELECT DISTINCT i.ARTICULO_ID
        FROM OrdenesProductos2 op
        INNER JOIN Inventario2 i ON op.INVENTARIO_ID = i.INVENTARIO_ID
        WHERE op.Orden_ID = ?
      `, [id], (err, result) => {
        if (err) {
          console.error("Error al obtener artículos del pedido:", err);
          reject(err);
        } else {
          console.log(`Artículos encontrados para el pedido ${id}:`, result);
          resolve(result);
        }
      });
    });

    let yaEnInventario = false;
    for (const prod of productosDelPedido) {
      const articuloId = prod.ARTICULO_ID; 
      if (!articuloId) continue;

      const inventarioExistenteResult = await new Promise((resolve, reject) => {
        connection.exec(`
          SELECT Inventario_ID 
          FROM Inventario2 
          WHERE Articulo_ID = ? AND Location_ID = ? AND FechaUltimaImportacion = CURRENT_DATE
        `, [articuloId, mainWarehouseLocationId], (err, result) => {
          if (err) {
            console.error(`Error al verificar inventario existente para Articulo_ID ${articuloId}:`, err);
            reject(err);
          } else {
            resolve(result);
          }
        });
      });

      const inventarioExistente = inventarioExistenteResult[0];
      if (inventarioExistente) {
        console.log(`El artículo ${articuloId} del pedido ${id} ya fue procesado en el almacén ${mainWarehouseNombre} hoy.`);
        yaEnInventario = true;
        break;
      }
    }

    if (yaEnInventario) {
      return res.status(400).json({
        error: `Uno o más artículos de este pedido ya fueron procesados en el almacén ${mainWarehouseNombre} hoy.`
      });
    }

    const productos = await new Promise((resolve, reject) => {
      connection.exec(`
        SELECT 
          op.OrdenesProductos_ID,
          op.Orden_ID,
          op.Inventario_ID,
          op.Cantidad,
          op.PrecioUnitario,
          i.ARTICULO_ID,
          a.Nombre as ArticuloNombre
        FROM OrdenesProductos2 op
        INNER JOIN Inventario2 i ON op.INVENTARIO_ID = i.INVENTARIO_ID
        INNER JOIN Articulo2 a ON i.ARTICULO_ID = a.ARTICULO_ID
        WHERE op.Orden_ID = ?
      `, [id], (err, result) => {
        if (err) {
          console.error("Error al buscar productos del pedido:", err);
          reject(err);
        } else {
          console.log("Productos encontrados para pedido", id, ":", result);
          resolve(result);
        }
      });
    });

    if (!productos || productos.length === 0) {
      return res.status(400).json({ error: "No se encontraron productos en el pedido" });
    }
    console.log(`Procesando ${productos.length} productos para el pedido ${id}`);

    for (const producto of productos) {
      const articuloId = producto.ARTICULO_ID; 
      const cantidad = producto.CANTIDAD;

      if (!articuloId) {
        console.log(`Producto sin Articulo_ID, no se puede procesar: ${JSON.stringify(producto)}`);
        continue;
      }

      console.log(`Procesando producto Articulo_ID: ${articuloId}, Cantidad: ${cantidad}`);
      const inventarioExistenteResult = await new Promise((resolve, reject) => {
        connection.exec(`
          SELECT Inventario_ID, StockActual FROM Inventario2 
          WHERE Articulo_ID = ? AND Location_ID = ?
        `, [articuloId, mainWarehouseLocationId], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      const inventarioExistente = inventarioExistenteResult[0];
      if (inventarioExistente) {
        console.log(`Actualizando inventario existente ${inventarioExistente.INVENTARIO_ID} con ${cantidad} unidades`);
        await new Promise((resolve, reject) => {
          connection.exec(`
            UPDATE Inventario2 SET 
              StockActual = StockActual + ?,
              Importacion = COALESCE(Importacion, 0) + ?,
              FechaUltimaImportacion = CURRENT_DATE
            WHERE Inventario_ID = ?
          `, [cantidad, cantidad, inventarioExistente.INVENTARIO_ID], (err, result) => {
            if (err) {
              console.error("Error al actualizar inventario:", err);
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
      } else {
        console.log(`Creando nuevo registro de inventario para Articulo_ID ${articuloId} en ubicación ${mainWarehouseLocationId}`);
        await new Promise((resolve, reject) => {
          connection.exec(`
            INSERT INTO Inventario2 (
              Articulo_ID, 
              Location_ID, 
              StockActual, 
              Importacion, 
              StockMinimo, 
              StockRecomendado, 
              FechaUltimaImportacion
            ) VALUES (?, ?, ?, ?, 10, 50, CURRENT_DATE)
          `, [articuloId, mainWarehouseLocationId, cantidad, cantidad], (err, result) => {
            if (err) {
              console.error("Error al insertar nuevo inventario:", err);
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
      }
    }
    res.status(200).json({
      message: `Pedido ${id} enviado al inventario de ${mainWarehouseNombre} correctamente`,
      totalProductos: productos.length,
      pedidoId: id,
      warehouseName: mainWarehouseNombre
    });

  } catch (error) {
    console.error("Error al recibir pedido:", error);
    let clientErrorMessage = "Error al actualizar inventario";
    if (error.message && error.message.includes("Too many parameters")) {
        clientErrorMessage = "Error de configuración interna del servidor. Demasiados parámetros en una consulta.";
    } else if (error.message && error.message.includes("invalid column name")) {
        clientErrorMessage = "Error de configuración interna del servidor. Nombre de columna inválido.";
    }
    
    res.status(500).json({ error: clientErrorMessage, detalle: error.message });
  }
};


const getProveedoresInventario = async (req, res) => {
  return getProveedores(req, res);
};

const getProductosInventarioPorProveedor = async (req, res) => {
  return getProductosPorProveedor(req, res);
};

// Nueva función para obtener ubicaciones disponibles
const getAvailableLocations = async (req, res) => {
  try {
    const query = `
      SELECT Location_ID as ID, Nombre, Tipo, Organizacion
      FROM Location2
      WHERE Tipo IN ('Almacen', 'Almacén', 'Principal', 'Tienda', 'Sucursal', 'Proveedor') 
      ORDER BY Nombre
    `;
    
    connection.exec(query, [], (err, result) => {
      if (err) {
        console.error("Error al obtener ubicaciones:", err);
        return res.status(500).json({ error: "Error al obtener ubicaciones", detalle: err.message });
      }
      
      const locationsFormateadas = (result || []).map(location => ({
        id: location.ID,
        nombre: location.NOMBRE,
        tipo: location.TIPO,
        organizacion: location.ORGANIZACION
      }));
      
      res.status(200).json(locationsFormateadas);
    });
  } catch (error) {
    console.error("Error general:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

module.exports = {
  getPedido,
  insertPedido,
  deletePedido,
  updatePedido,
  getProveedores,
  getProductosPorProveedor,
  aprobarPedido,
  entregarPedido,
  getPedidosProveedor,
  getDetallesPedido,
  enviarAInventario,
  getProveedoresInventario,
  getProductosInventarioPorProveedor,
  getAvailableLocations, 
  actualizarEstatus
};