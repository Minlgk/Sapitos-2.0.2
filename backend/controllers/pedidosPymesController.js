const { connection } = require("../config/db");
const { generarNotificacion } = require("./alertaController");

const getPedidosPymes = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT
        o.ORDEN_ID as id,
        o.FECHACREACION as fecha,
        u.NOMBRE as solicitadoPor,
        u.CORREO as correoSolicitante,
        o.TOTAL as total,
        o.ESTADO as estado,
        o.FECHAESTIMADAENTREGA as fechaEstimada,
        o.TIPOORDEN as tipoOrden,
        o.DESCUENTOAPLICADO as descuento,
        o.ORGANIZACION as organizacion
      FROM DBADMIN.ORDENES2 o
      INNER JOIN DBADMIN.USUARIO2 u ON o.CREADO_POR_ID = u.USUARIO_ID 
      WHERE o.TIPOORDEN = 'PYME'
      ORDER BY o.FECHACREACION DESC
    `;

    connection.exec(query, [], (err, result) => {
      if (err) {
        console.error("Error al obtener pedidos PYMES:", err);
        return res.status(500).json({ error: "Error al obtener pedidos" });
      }
      res.status(200).json(result || []);
    });
  } catch (error) {
    console.error("Error general:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const aprobarPedidoPyme = async (req, res) => {
  const { id } = req.params;
  
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: "ID de pedido inválido" });
  }

  try {
    // Verificar que el pedido esté pendiente y sea tipo PYME
    const checkQuery = `
      SELECT Estado, Organizacion, TipoOrden 
      FROM Ordenes2 
      WHERE Orden_ID = ?
    `;
    
    connection.exec(checkQuery, [id], async (err, result) => {
      if (err) {
        console.error("Error al verificar pedido:", err);
        return res.status(500).json({ error: "Error al verificar el pedido" });
      }
      
      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }

      const pedido = result[0];
      
      if (pedido.TIPOORDEN !== 'PYME') {
        return res.status(400).json({ error: "Este pedido no es de tipo PYME" });
      }

      if (pedido.ESTADO !== 'Pendiente') {
        return res.status(400).json({ error: "Solo se pueden aceptar pedidos en estado Pendiente" });
      }

      // Actualizar estado a 'En Reparto'
      const updateQuery = `
        UPDATE Ordenes2 SET 
          Estado = 'En Reparto',
          FechaAceptacion = CURRENT_DATE,
          FechaEstimadaEntrega = ADD_DAYS(CURRENT_DATE, 7)
        WHERE Orden_ID = ?
      `;
      
      connection.exec(updateQuery, [id], async (updateErr) => {
        if (updateErr) {
          console.error("Error al aceptar pedido:", updateErr);
          return res.status(500).json({ error: "Error al aceptar el pedido" });
        }

        // Generar notificación
        try {
          await generarNotificacion(
            `Pedido PYME #${id} de ${pedido.ORGANIZACION} ha sido aprobado`,
            'Pedido PYME Aprobado',
            'success',
            1, // Location_ID por defecto
            id
          );
        } catch (notifError) {
          console.error("Error al generar notificación:", notifError);
        }
        
        res.status(200).json({ 
          message: "Pedido PYME aceptado exitosamente",
          nuevoEstado: "En Reparto",
          fechaEstimadaEntrega: "7 días desde hoy"
        });
      });
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const rechazarPedidoPyme = async (req, res) => {
  const { id } = req.params;
  
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: "ID de pedido inválido" });
  }

  try {
    // Verificar que el pedido esté pendiente y sea tipo PYME
    const checkQuery = `
      SELECT Estado, Organizacion, TipoOrden 
      FROM Ordenes2 
      WHERE Orden_ID = ?
    `;
    
    connection.exec(checkQuery, [id], async (err, result) => {
      if (err) {
        console.error("Error al verificar pedido:", err);
        return res.status(500).json({ error: "Error al verificar el pedido" });
      }
      
      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }

      const pedido = result[0];
      
      if (pedido.TIPOORDEN !== 'PYME') {
        return res.status(400).json({ error: "Este pedido no es de tipo PYME" });
      }

      if (pedido.ESTADO !== 'Pendiente') {
        return res.status(400).json({ error: "Solo se pueden rechazar pedidos en estado Pendiente" });
      }

      // Actualizar estado a 'Rechazado'
      const updateQuery = `
        UPDATE Ordenes2 SET 
          Estado = 'Rechazado',
          FechaAceptacion = CURRENT_DATE
        WHERE Orden_ID = ?
      `;
      
      connection.exec(updateQuery, [id], async (updateErr) => {
        if (updateErr) {
          console.error("Error al rechazar pedido:", updateErr);
          return res.status(500).json({ error: "Error al rechazar el pedido" });
        }

        // Generar notificación
        try {
          await generarNotificacion(
            `Pedido PYME #${id} de ${pedido.ORGANIZACION} ha sido rechazado`,
            'Pedido PYME Rechazado',
            'error',
            1, // Location_ID por defecto
            id
          );
        } catch (notifError) {
          console.error("Error al generar notificación:", notifError);
        }
        
        res.status(200).json({ 
          message: "Pedido PYME rechazado exitosamente"
        });
      });
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const getDetallePedidoPyme = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: "ID de pedido inválido" });
  }

  try {
    const query = `
      SELECT 
        a.NOMBRE as nombre,
        c.NOMBRE as categoria,
        op.CANTIDAD as cantidad,
        op.PRECIOUNITARIO as precioUnitario,
        (op.CANTIDAD * op.PRECIOUNITARIO) as subtotal,
        i.STOCKACTUAL as stockDisponible
      FROM DBADMIN.ORDENESPRODUCTOS2 op
      INNER JOIN DBADMIN.INVENTARIO2 i ON op.INVENTARIO_ID = i.INVENTARIO_ID
      INNER JOIN DBADMIN.ARTICULO2 a ON i.ARTICULO_ID = a.ARTICULO_ID
      INNER JOIN DBADMIN.CATEGORIA2 c ON a.CATEGORIA_ID = c.CATEGORIA_ID
      WHERE op.ORDEN_ID = ?
    `;

    connection.exec(query, [id], (err, result) => {
      if (err) {
        console.error("Error al obtener detalles del pedido:", err);
        return res.status(500).json({ error: "Error al obtener detalles del pedido" });
      }

      if (!result || result.length === 0) {
        return res.status(404).json({ error: "No se encontraron detalles para este pedido" });
      }

      res.status(200).json(result);
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

module.exports = {
  getPedidosPymes,
  aprobarPedidoPyme,
  rechazarPedidoPyme,
  getDetallePedidoPyme
}; 