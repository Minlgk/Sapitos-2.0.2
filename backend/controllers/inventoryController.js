const { connection } = require("../config/db");
const jwt = require("jsonwebtoken");
const { generarNotificacion } = require("./alertaController");

const getInventory = async (req, res) => {
  try {
    const query = `
      SELECT
        i.Inventario_ID,
        a.Articulo_ID,
        a.Nombre AS ArticuloNombre,
        a.Categoria,
        a.PrecioProveedor,
        a.PrecioVenta,
        a.Temporada,
        i.StockActual,
        i.StockMinimo,
        i.StockRecomendado,
        i.StockSeguridad,
        i.FechaUltimaImportacion,
        i.FechaUltimaExportacion,
        i.MargenGanancia,
        i.TiempoReposicion,
        i.DemandaPromedio,
        l.Nombre AS LocationNombre,
        l.Tipo AS LocationTipo
      FROM Inventario2 i
      INNER JOIN Articulo2 a ON i.Articulo_ID = a.Articulo_ID
      INNER JOIN Location2 l ON i.Location_ID = l.Location_ID
      WHERE l.Tipo = 'Oficina'  -- si lo ocupamos ponemos la ubicacion que nos interesa
    `;

    connection.exec(query, [], async (err, result) => {
      if (err) {
        console.error("Error al obtener el inventario", err);
        return res.status(500).json({ error: "Error al obtener el inventario" });
      }

      const formatted = result.map(item => ({
        inventarioId: item.INVENTARIO_ID,
        articuloId: item.ARTICULO_ID,
        nombre: item.ARTICULONOMBRE,
        categoria: item.CATEGORIA,
        precioProveedor: item.PRECIOPROVEEDOR,
        precioVenta: item.PRECIOVENTA,
        temporada: item.TEMPORADA,
        stockActual: item.STOCKACTUAL,
        stockMinimo: item.STOCKMINIMO,
        stockRecomendado: item.STOCKRECOMENDADO,
        stockSeguridad: item.STOCKSEGURIDAD,
        fechaUltimaImportacion: item.FECHAULTIMAIMPORTACION,
        fechaUltimaExportacion: item.FECHAULTIMAEXPORTACION,
        margenGanancia: item.MARGENGANANCIA,
        tiempoReposicion: item.TIEMPOREPOSICION,
        demandaPromedio: item.DEMANDAPROMEDIO,
        locationNombre: item.LOCATIONNOMBRE,
        locationTipo: item.LOCATIONTIPO
      }));
      res.status(200).json(formatted);
    });
  } catch (error) {
    console.error("Error general:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const insertInventory = async (req, res) => {
  const { 
    articuloId, 
    locationId, 
    stockActual, 
    stockMinimo, 
    stockRecomendado, 
    stockSeguridad,
    margenGanancia,
    tiempoReposicion,
    demandaPromedio
  } = req.body;

  try {
    // Verificar que el artículo existe
    const checkArticuloQuery = `SELECT Articulo_ID FROM Articulo2 WHERE Articulo_ID = ?`;
    
    connection.exec(checkArticuloQuery, [articuloId], (err, articuloResult) => {
      if (err) {
        console.error("Error al verificar el artículo:", err);
        return res.status(500).json({ error: "Error al verificar el artículo" });
      }

      if (articuloResult.length === 0) {
        return res.status(400).json({ error: "El artículo especificado no existe" });
      }

      // Verificar que la ubicación existe
      const checkLocationQuery = `SELECT Location_ID FROM Location2 WHERE Location_ID = ?`;
      
      connection.exec(checkLocationQuery, [locationId], (err, locationResult) => {
        if (err) {
          console.error("Error al verificar la ubicación:", err);
          return res.status(500).json({ error: "Error al verificar la ubicación" });
        }

        if (locationResult.length === 0) {
          return res.status(400).json({ error: "La ubicación especificada no existe" });
        }

        // Insertar en inventario
        const insertQuery = `
          INSERT INTO Inventario2 
          (Articulo_ID, Location_ID, StockActual, StockMinimo, StockRecomendado, 
           StockSeguridad, MargenGanancia, TiempoReposicion, DemandaPromedio)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
          articuloId, locationId, stockActual, stockMinimo, stockRecomendado,
          stockSeguridad, margenGanancia, tiempoReposicion, demandaPromedio
        ];

        connection.prepare(insertQuery, (err, statement) => {
          if (err) {
            console.error("Error al preparar la consulta de inserción:", err);
            return res.status(500).json({ error: "Error al preparar la consulta" });
          }

          statement.execute(params, (err, result) => {
            if (err) {
              console.error("Error al ejecutar la consulta de inserción:", err);
              return res.status(500).json({ error: "Error al insertar datos en inventario" });
            }

            res.status(200).json({ message: "Inventario agregado exitosamente" });
          });
        });
      });
    });
  } catch (error) {
    console.error("Error general:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const getInventoryById = async (req, res) => {
  const id = req.params.id;
  
  try {
    const query = `
      SELECT 
        i.Inventario_ID,
        i.Articulo_ID,
        i.Location_ID,
        a.Nombre AS ArticuloNombre,
        a.Categoria,
        a.PrecioProveedor,
        a.PrecioVenta,
        a.Temporada,
        i.StockActual,
        i.StockMinimo,
        i.StockRecomendado,
        i.StockSeguridad,
        i.Importacion,
        i.Exportacion,
        i.FechaUltimaImportacion,
        i.FechaUltimaExportacion,
        i.MargenGanancia,
        i.TiempoReposicion,
        i.DemandaPromedio,
        l.Nombre AS LocationNombre,
        l.Tipo AS LocationTipo,
        l.PosicionX,
        l.PosicionY
      FROM Inventario2 i
      INNER JOIN Articulo2 a ON i.Articulo_ID = a.Articulo_ID
      INNER JOIN Location2 l ON i.Location_ID = l.Location_ID
      WHERE i.Inventario_ID = ?
    `;

    connection.exec(query, [id], (err, result) => {
      if (err) {
        console.error("Error al obtener inventario:", err);
        return res.status(500).json({ error: "Error al obtener inventario" });
      }

      if (result.length === 0) {
        return res.status(404).json({ error: "Inventario no encontrado" });
      }

      const item = result[0];
      const formatted = {
        inventarioId: item.INVENTARIO_ID,
        articuloId: item.ARTICULO_ID,
        locationId: item.LOCATION_ID,
        nombre: item.ARTICULONOMBRE,
        categoria: item.CATEGORIA,
        precioProveedor: item.PRECIOPROVEEDOR,
        precioVenta: item.PRECIOVENTA,
        temporada: item.TEMPORADA,
        stockActual: item.STOCKACTUAL,
        stockMinimo: item.STOCKMINIMO,
        stockRecomendado: item.STOCKRECOMENDADO,
        stockSeguridad: item.STOCKSEGURIDAD,
        importacion: item.IMPORTACION,
        exportacion: item.EXPORTACION,
        fechaUltimaImportacion: item.FECHAULTIMAIMPORTACION,
        fechaUltimaExportacion: item.FECHAULTIMAEXPORTACION,
        margenGanancia: item.MARGENGANANCIA,
        tiempoReposicion: item.TIEMPOREPOSICION,
        demandaPromedio: item.DEMANDAPROMEDIO,
        locationNombre: item.LOCATIONNOMBRE,
        locationTipo: item.LOCATIONTIPO,
        posicionX: item.POSICIONX,
        posicionY: item.POSICIONY
      };

      res.status(200).json(formatted);
    });
  } catch (error) {
    console.error("Error general:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const updateInventory = async (req, res) => {
  const id = req.params.id;
  const {
    stockActual,
    stockMinimo,
    stockRecomendado,
    stockSeguridad,
    margenGanancia,
    tiempoReposicion,
    demandaPromedio
  } = req.body;

  try {
    // Verificar que el inventario exista y obtener datos actuales
    const getInventoryQuery = `
      SELECT 
        i.*, 
        a.Nombre AS ArticuloNombre, 
        l.Nombre AS LocationNombre 
      FROM Inventario2 i
      INNER JOIN Articulo2 a ON i.Articulo_ID = a.Articulo_ID
      INNER JOIN Location2 l ON i.Location_ID = l.Location_ID
      WHERE i.Inventario_ID = ?
    `;
    
    const inventoryResult = await new Promise((resolve, reject) => {
      connection.exec(getInventoryQuery, [id], (err, result) => {
        if (err) {
          console.error("Error al verificar inventario:", err);
          reject(err);
          return;
        }
        resolve(result);
      });
    });

    if (!inventoryResult || inventoryResult.length === 0) {
      return res.status(404).json({ error: "Inventario no encontrado" });
    }

    const inventarioActual = inventoryResult[0];

    // Construir la consulta de actualización
    let updateQuery = "UPDATE Inventario2 SET ";
    let updateParams = [];
    let updateFields = [];

    if (stockActual !== undefined) {
      updateFields.push("StockActual = ?");
      updateParams.push(stockActual);
    }

    if (stockMinimo !== undefined) {
      updateFields.push("StockMinimo = ?");
      updateParams.push(stockMinimo);
    }

    if (stockRecomendado !== undefined) {
      updateFields.push("StockRecomendado = ?");
      updateParams.push(stockRecomendado);
    }

    if (stockSeguridad !== undefined) {
      updateFields.push("StockSeguridad = ?");
      updateParams.push(stockSeguridad);
    }

    if (margenGanancia !== undefined) {
      updateFields.push("MargenGanancia = ?");
      updateParams.push(margenGanancia);
    }

    if (tiempoReposicion !== undefined) {
      updateFields.push("TiempoReposicion = ?");
      updateParams.push(tiempoReposicion);
    }

    if (demandaPromedio !== undefined) {
      updateFields.push("DemandaPromedio = ?");
      updateParams.push(demandaPromedio);
    }

    // Si no hay campos para actualizar, retornar error
    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No se especificaron campos para actualizar" });
    }

    updateQuery += updateFields.join(", ") + " WHERE Inventario_ID = ?";
    updateParams.push(id);

    // Ejecutar la actualización
    await new Promise((resolve, reject) => {
      connection.exec(updateQuery, updateParams, (err, result) => {
        if (err) {
          console.error("Error al actualizar inventario:", err);
          reject(err);
          return;
        }
        resolve(result);
      });
    });

    // Verificar si se actualizó el stock y comprobar si está por debajo del mínimo
    if (stockActual !== undefined) {
      const stockMinimoActual = stockMinimo !== undefined ? stockMinimo : inventarioActual.STOCKMINIMO;
      
      // Si el stock actual está por debajo del mínimo, generar una notificación
      if (stockActual < stockMinimoActual) {
        try {
          // Calcular cuántos días tardará en agotarse el inventario basado en demanda promedio
          const demandaActual = demandaPromedio !== undefined ? demandaPromedio : inventarioActual.DEMANDAPROMEDIO;
          let diasHastaAgotarse = '?';
          
          if (demandaActual && demandaActual > 0) {
            diasHastaAgotarse = (stockActual / demandaActual).toFixed(1);
          }
          
          // Calcular unidades a pedir (normalmente sería hasta llegar al stock recomendado)
          const stockRecomendadoActual = stockRecomendado !== undefined ? stockRecomendado : inventarioActual.STOCKRECOMENDADO;
          const unidadesAPedir = Math.max(0, stockRecomendadoActual - stockActual);
          
          await generarNotificacion(
            `Artículo ${inventarioActual.ARTICULONOMBRE} en ${inventarioActual.LOCATIONNOMBRE} tiene stock bajo (${stockActual}/${stockMinimoActual}). Se agotará en ${diasHastaAgotarse} días. Pedir ${unidadesAPedir} unidades.`,
            `Reabastecimiento necesario`,
            'danger',
            inventarioActual.LOCATION_ID
          );
          
          console.log(`Notificación generada para stock bajo del artículo ${inventarioActual.ARTICULONOMBRE}`);
        } catch (notifError) {
          // No bloqueamos la actualización del inventario si falla la notificación
          console.error("Error al generar notificación de stock bajo:", notifError);
        }
      }
    }

    res.json({ message: "Inventario actualizado exitosamente" });
  } catch (error) {
    console.error("Error general al actualizar inventario:", error);
    res.status(500).json({ error: "Error al actualizar el inventario", detalle: error.message });
  }
};

const deleteInventory = async (req, res) => {
  const id = req.params.id;

  try {
    // Verificar si el inventario existe
    const checkQuery = `SELECT Inventario_ID FROM Inventario2 WHERE Inventario_ID = ?`;
    
    connection.exec(checkQuery, [id], (err, result) => {
      if (err) {
        console.error("Error al verificar el inventario:", err);
        return res.status(500).json({ error: "Error al verificar el inventario" });
      }

      if (result.length === 0) {
        return res.status(404).json({ error: "Inventario no encontrado" });
      }

      // Proceder con la eliminación
      const deleteQuery = `DELETE FROM Inventario2 WHERE Inventario_ID = ?`;

      connection.exec(deleteQuery, [id], (err, result) => {
        if (err) {
          console.error("Error al eliminar el inventario:", err);
          return res.status(500).json({ error: "Error al eliminar el inventario" });
        }

        res.status(200).json({ message: "Inventario eliminado exitosamente" });
      });
    });
  } catch (error) {
    console.error("Error general:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const getLocaciones = async (req, res) => {
  try {
    const query = `
      SELECT 
        Location_ID,
        Nombre,
        Tipo,
        PosicionX,
        PosicionY,
        FechaCreado
      FROM Location2
      ORDER BY Nombre
    `;

    connection.exec(query, [], async (err, result) => {
      if (err) {
        console.error("Error al obtener las ubicaciones", err);
        return res.status(500).json({ error: "Error al obtener las ubicaciones" });
      }

      const locaciones = result.map(item => ({
        locationId: item.LOCATION_ID,
        nombre: item.NOMBRE,
        tipo: item.TIPO,
        posicionX: item.POSICIONX,
        posicionY: item.POSICIONY,
        fechaCreado: item.FECHACREADO
      }));
      
      res.status(200).json(locaciones);
    });
  } catch (error) {
    console.error("Error general:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const getInventoryByLocation = async (req, res) => {
  const locationId = req.params.locationId;
  
  try {
    const query = `
      SELECT
        i.Inventario_ID,
        i.Articulo_ID,
        a.Nombre AS ArticuloNombre,
        a.Categoria,
        a.PrecioProveedor,
        a.PrecioVenta,
        a.Temporada,
        i.StockActual,
        i.StockMinimo,
        i.StockRecomendado,
        i.StockSeguridad,
        i.FechaUltimaImportacion,
        i.FechaUltimaExportacion,
        i.MargenGanancia,
        i.TiempoReposicion,
        i.DemandaPromedio,
        l.Nombre AS LocationNombre,
        l.Tipo AS LocationTipo
      FROM Inventario2 i
      INNER JOIN Articulo2 a ON i.Articulo_ID = a.Articulo_ID
      INNER JOIN Location2 l ON i.Location_ID = l.Location_ID
      WHERE i.Location_ID = ?
    `;

    connection.exec(query, [locationId], (err, result) => {
      if (err) {
        console.error("Error al obtener inventario por ubicación:", err);
        return res.status(500).json({ error: "Error al obtener inventario por ubicación" });
      }

      if (result.length === 0) {
        return res.status(404).json({ error: "No se encontró inventario para esta ubicación" });
      }

      const formatted = result.map(item => ({
        inventarioId: item.INVENTARIO_ID,
        articuloId: item.ARTICULO_ID,
        nombre: item.ARTICULONOMBRE,
        categoria: item.CATEGORIA,
        precioProveedor: item.PRECIOPROVEEDOR,
        precioVenta: item.PRECIOVENTA,
        temporada: item.TEMPORADA,
        stockActual: item.STOCKACTUAL,
        stockMinimo: item.STOCKMINIMO,
        stockRecomendado: item.STOCKRECOMENDADO,
        stockSeguridad: item.STOCKSEGURIDAD,
        fechaUltimaImportacion: item.FECHAULTIMAIMPORTACION,
        fechaUltimaExportacion: item.FECHAULTIMAEXPORTACION,
        margenGanancia: item.MARGENGANANCIA,
        tiempoReposicion: item.TIEMPOREPOSICION,
        demandaPromedio: item.DEMANDAPROMEDIO,
        locationNombre: item.LOCATIONNOMBRE,
        locationTipo: item.LOCATIONTIPO
      }));

      res.status(200).json(formatted);
    });
  } catch (error) {
    console.error("Error general:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const getArticulos = async (req, res) => {
  try {
    const query = `
      SELECT 
        Articulo_ID,
        Nombre,
        Categoria,
        PrecioProveedor,
        PrecioVenta,
        Temporada
      FROM Articulo2
      ORDER BY Nombre
    `;

    connection.exec(query, [], async (err, result) => {
      if (err) {
        console.error("Error al obtener los artículos", err);
        return res.status(500).json({ error: "Error al obtener los artículos" });
      }

      const articulos = result.map(item => ({
        articuloId: item.ARTICULO_ID,
        nombre: item.NOMBRE,
        categoria: item.CATEGORIA,
        precioProveedor: item.PRECIOPROVEEDOR,
        precioVenta: item.PRECIOVENTA,
        temporada: item.TEMPORADA
      }));
      
      res.status(200).json(articulos);
    });
  } catch (error) {
    console.error("Error general:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const getInventoryByCategory = async (req, res) => {
  const categoria = req.params.categoria;
  
  try {
    const query = `
      SELECT
        i.Inventario_ID,
        i.Articulo_ID,
        a.Nombre AS ArticuloNombre,
        a.Categoria,
        a.PrecioProveedor,
        a.PrecioVenta,
        a.Temporada,
        i.StockActual,
        i.StockMinimo,
        i.StockRecomendado,
        i.StockSeguridad,
        i.FechaUltimaImportacion,
        i.FechaUltimaExportacion,
        i.MargenGanancia,
        i.TiempoReposicion,
        i.DemandaPromedio,
        l.Nombre AS LocationNombre,
        l.Tipo AS LocationTipo
      FROM Inventario2 i
      INNER JOIN Articulo2 a ON i.Articulo_ID = a.Articulo_ID
      INNER JOIN Location2 l ON i.Location_ID = l.Location_ID
      WHERE a.Categoria = ?
    `;

    connection.exec(query, [categoria], (err, result) => {
      if (err) {
        console.error("Error al obtener inventario por categoría:", err);
        return res.status(500).json({ error: "Error al obtener inventario por categoría" });
      }

      if (result.length === 0) {
        return res.status(404).json({ error: "No se encontró inventario para esta categoría" });
      }

      const formatted = result.map(item => ({
        inventarioId: item.INVENTARIO_ID,
        articuloId: item.ARTICULO_ID,
        nombre: item.ARTICULONOMBRE,
        categoria: item.CATEGORIA,
        precioProveedor: item.PRECIOPROVEEDOR,
        precioVenta: item.PRECIOVENTA,
        temporada: item.TEMPORADA,
        stockActual: item.STOCKACTUAL,
        stockMinimo: item.STOCKMINIMO,
        stockRecomendado: item.STOCKRECOMENDADO,
        stockSeguridad: item.STOCKSEGURIDAD,
        fechaUltimaImportacion: item.FECHAULTIMAIMPORTACION,
        fechaUltimaExportacion: item.FECHAULTIMAEXPORTACION,
        margenGanancia: item.MARGENGANANCIA,
        tiempoReposicion: item.TIEMPOREPOSICION,
        demandaPromedio: item.DEMANDAPROMEDIO,
        locationNombre: item.LOCATIONNOMBRE,
        locationTipo: item.LOCATIONTIPO
      }));

      res.status(200).json(formatted);
    });
  } catch (error) {
    console.error("Error general:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

module.exports = {
  getInventory,
  insertInventory,
  getInventoryById,
  updateInventory,
  deleteInventory,
  getLocaciones,
  getInventoryByLocation,
  getArticulos,
  getInventoryByCategory
};