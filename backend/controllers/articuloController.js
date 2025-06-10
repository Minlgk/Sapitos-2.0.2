const { connection } = require("../config/db");

// Obtener todos los artículos
const getArticulos = (req, res) => {
  const query = "SELECT * FROM Articulo2";

  connection.exec(query, [], (err, rows) => {
    if (err) {
      console.error("Error al obtener artículos:", err);
      return res.status(500).json({ error: "Error al obtener los artículos" });
    }

    res.json(rows);
  });
};

// Crear nuevo artículo
const createArticulo = (req, res) => {
  const { Nombre, Categoria, PrecioProveedor, PrecioVenta, Temporada } = req.body;

  if (!Nombre || !Categoria || PrecioProveedor == null || PrecioVenta == null || !Temporada) {
    return res.status(400).json({ error: "Faltan campos requeridos" });
  }

  const query = `
    INSERT INTO Articulo2 (Nombre, Categoria, PrecioProveedor, PrecioVenta, Temporada)
    VALUES (?, ?, ?, ?, ?)
  `;

  connection.prepare(query, (err, statement) => {
    if (err) {
      console.error("Error preparando query:", err);
      return res.status(500).json({ error: err.message });
    }

    statement.exec([Nombre, Categoria, PrecioProveedor, PrecioVenta, Temporada], (execErr) => {
      if (execErr) {
        console.error("Error ejecutando query:", execErr);
        return res.status(500).json({ error: execErr.message });
      }

      res.status(201).json({ message: "Artículo creado exitosamente" });
    });
  });
};

// Actualizar artículo existente
const updateArticulo = (req, res) => {
  const { id } = req.params;
  const { Nombre, Categoria, PrecioProveedor, PrecioVenta, Temporada } = req.body;

  if (!id || !Nombre || !Categoria || PrecioProveedor == null || PrecioVenta == null || !Temporada) {
    return res.status(400).json({ error: "Faltan campos requeridos" });
  }

  const query = `
    UPDATE Articulo2 
    SET Nombre = ?, Categoria = ?, PrecioProveedor = ?, PrecioVenta = ?, Temporada = ?
    WHERE Articulo_ID = ?
  `;

  connection.prepare(query, (err, statement) => {
    if (err) {
      console.error("Error preparando query:", err);
      return res.status(500).json({ error: err.message });
    }

    statement.exec([Nombre, Categoria, PrecioProveedor, PrecioVenta, Temporada, id], (execErr) => {
      if (execErr) {
        console.error("Error ejecutando update:", execErr);
        return res.status(500).json({ error: execErr.message });
      }

      res.json({ message: "Artículo actualizado correctamente" });
    });
  });
};

// Eliminar artículo
const deleteArticulo = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "ID de artículo requerido" });
  }

  const query = `DELETE FROM Articulo2 WHERE Articulo_ID = ?`;

  connection.prepare(query, (err, statement) => {
    if (err) {
      console.error("Error preparando delete:", err);
      return res.status(500).json({ error: err.message });
    }

    statement.exec([id], (execErr) => {
      if (execErr) {
        console.error("Error ejecutando delete:", execErr);
        return res.status(500).json({ error: execErr.message });
      }

      res.json({ message: "Artículo eliminado correctamente" });
    });
  });
};


module.exports = {
  getArticulos,
  createArticulo,
  updateArticulo,
  deleteArticulo,
};
