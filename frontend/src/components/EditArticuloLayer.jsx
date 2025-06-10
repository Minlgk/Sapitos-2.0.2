import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const EditArticuloLayer = () => {
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://sapitos-backend.cfapps.us10-001.hana.ondemand.com";
  const { id } = useParams();
  const navigate = useNavigate();

  const [articulo, setArticulo] = useState({
    Nombre: "",
    Categoria: "",
    PrecioProveedor: "",
    PrecioVenta: "",
    Temporada: "",
  });

  useEffect(() => {
    const fetchArticulo = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/articulo`, {
          withCredentials: true,
        });
        const art = res.data.find((a) => a.ARTICULO_ID === parseInt(id));
        if (art) {
          setArticulo({
            Nombre: art.NOMBRE,
            Categoria: art.CATEGORIA,
            PrecioProveedor: art.PRECIOPROVEEDOR,
            PrecioVenta: art.PRECIOVENTA,
            Temporada: art.TEMPORADA,
          });
        } else {
          alert("Artículo no encontrado.");
          navigate("/articulos");
        }
      } catch (error) {
        console.error("Error al cargar artículo:", error);
        alert("No se pudo cargar el artículo.");
      }
    };

    fetchArticulo();
  }, [id]);

  const handleChange = (e) => {
    setArticulo({ ...articulo, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/articulo/${id}`, articulo, {
        withCredentials: true,
      });
      alert("Artículo actualizado correctamente.");
      navigate("/articulos");
    } catch (error) {
      console.error("Error al actualizar artículo:", error);
      alert("No se pudo actualizar el artículo.");
    }
  };

  return (
    <div className="card p-4">
      <h3 className="mb-4">Editar Artículo</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Nombre</label>
          <input
            type="text"
            className="form-control"
            name="Nombre"
            value={articulo.Nombre}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Categoría</label>
          <input
            type="text"
            className="form-control"
            name="Categoria"
            value={articulo.Categoria}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Precio Proveedor</label>
          <input
            type="number"
            step="0.01"
            className="form-control"
            name="PrecioProveedor"
            value={articulo.PrecioProveedor}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Precio Venta</label>
          <input
            type="number"
            step="0.01"
            className="form-control"
            name="PrecioVenta"
            value={articulo.PrecioVenta}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Temporada</label>
          <input
            type="text"
            className="form-control"
            name="Temporada"
            value={articulo.Temporada}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary me-2">
          Guardar Cambios
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate("/articulos")}
        >
          Cancelar
        </button>
      </form>
    </div>
  );
};

export default EditArticuloLayer;
