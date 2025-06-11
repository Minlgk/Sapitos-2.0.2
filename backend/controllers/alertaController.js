const { connection } = require("../config/db");

const getAlertas = async (req, res) => {
  console.log("⚠️ Recibida solicitud GET /alertas");
  console.log("Query params:", req.query);
  
  try {
    // Obtener el location_id de la solicitud (ya sea de params o query)
    const location_id = req.query.location_id || req.params.locationId;
    console.log("Location ID utilizado:", location_id);
    
    // Consulta mejorada para obtener alertas únicas, agrupando por descripción
    const query = `
      WITH RankedAlertas AS (
        SELECT 
          "ALERTA_ID" as id,
          TO_VARCHAR("DESCRIPCION") as descripcion,
          "FECHACREACION" as fecha,
          "ORDENESPRODUCTOS_ID" as orden_id,
          "LOCATION_ID" as location_id,
          "PRIORIDAD" as prioridad,
          ROW_NUMBER() OVER (PARTITION BY TO_VARCHAR("DESCRIPCION") ORDER BY "FECHACREACION" DESC) as rn
        FROM "DBADMIN"."ALERTAS2"
        WHERE 1=1
        ${location_id ? `AND "LOCATION_ID" = ${location_id}` : ''}
      )
      SELECT id, descripcion, fecha, orden_id, location_id, prioridad
      FROM RankedAlertas
      WHERE rn = 1
      ORDER BY fecha DESC
      LIMIT 15
    `;
    
    console.log("Query a ejecutar:", query);
    
    // Ejecutar la consulta
    connection.exec(query, [], (err, results) => {
      if (err) {
        console.error("❌ Error en la consulta SQL:", err);
        return res.status(500).json({
          success: false,
          error: 'Error en la consulta SQL',
          details: err.message
        });
      }
      
      console.log("✅ Consulta exitosa, registros encontrados:", results ? results.length : 0);
      
      if (!results || !Array.isArray(results) || results.length === 0) {
        console.log("Sin resultados, devolviendo array vacío");
        return res.status(200).json([]);
      }
      
      // Mostrar las propiedades de la primera fila para debug
      console.log("Primera fila recibida - nombres de columnas:", Object.keys(results[0]));
      
      // Mapear los resultados al formato esperado
      const alertas = results.map(row => {
        // Determinar tipo de alerta
        let tipo = 'primary';
        const descripcion = row.DESCRIPCION || '';
        const prioridad = row.PRIORIDAD;
        
        // Por prioridad
        if (prioridad === 'ALTA' || prioridad === 'HIGH') {
          tipo = 'danger';
        } else if (prioridad === 'MEDIA' || prioridad === 'MEDIUM') {
          tipo = 'warning';
        } else if (prioridad === 'BAJA' || prioridad === 'LOW') {
          tipo = 'info';
        }
        
        // Por contenido de descripción
        if (descripcion.toLowerCase().includes('error') || 
            descripcion.toLowerCase().includes('fallo') ||
            descripcion.toLowerCase().includes('stock bajo') ||
            descripcion.toLowerCase().includes('agotado')) {
          tipo = 'danger';
        } else if (descripcion.toLowerCase().includes('completado') || 
                  descripcion.toLowerCase().includes('aceptada') ||
                  descripcion.toLowerCase().includes('exitosa')) {
          tipo = 'success';
        } else if (descripcion.toLowerCase().includes('retrasada') ||
                  descripcion.toLowerCase().includes('pendiente')) {
          tipo = 'warning';
        }
        
        // Generar título
        let titulo = 'Alerta';
        if (descripcion.toLowerCase().includes('inventario') || descripcion.toLowerCase().includes('stock')) {
          titulo = 'Inventario';
        } else if (descripcion.toLowerCase().includes('pedido') || descripcion.toLowerCase().includes('orden')) {
          titulo = 'Pedido';
        } else if (descripcion.toLowerCase().includes('usuario') || descripcion.toLowerCase().includes('cliente')) {
          titulo = 'Usuario';
        } else if (descripcion.toLowerCase().includes('sistema') || descripcion.toLowerCase().includes('error')) {
          titulo = 'Sistema';
        }
        
        // Corregir formato de fecha si es necesario
        let fecha = row.FECHA;
        // Si la fecha es una cadena y parece un formato de fecha, intentar formatearla
        if (typeof fecha === 'string' && !isNaN(Date.parse(fecha))) {
          const dateObj = new Date(fecha);
          // Verificar si la fecha es válida y no es futura
          const now = new Date();
          if (dateObj > now) {
            // Si es fecha futura, probablemente un error de formato
            // Setear a fecha actual
            fecha = now.toISOString();
          }
        }
        
        return {
          id: row.ID,
          tipo,
          titulo,
          descripcion: row.DESCRIPCION,
          fecha,
          orden_id: row.ORDEN_ID,
          location_id: row.LOCATION_ID,
          prioridad: row.PRIORIDAD
        };
      });
      
      console.log("Enviando respuesta con", alertas.length, "alertas");
      res.status(200).json(alertas);
    });
  } catch (error) {
    console.error("❌ Error general:", error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
};

const deleteAlerta = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `DELETE FROM "DBADMIN"."ALERTAS2" WHERE "ALERTA_ID" = ${id}`;
    
    connection.exec(query, [], (err, result) => {
      if (err) {
        console.error('Error al eliminar alerta:', err);
        return res.status(500).json({
          success: false,
          error: 'Error al eliminar la alerta',
          details: err.message
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Alerta eliminada correctamente'
      });
    });
  } catch (error) {
    console.error('Error al eliminar alerta:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
};

const generarNotificacion = async (req, res) => {
  // Implementación pendiente
  res.status(501).json({
    success: false,
    message: 'Funcionalidad no implementada'
  });
};


module.exports = {
  getAlertas,
  deleteAlerta,
  generarNotificacion
}; 