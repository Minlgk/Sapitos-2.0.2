import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const EditarLocation = () => {
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://sapitos-backend.cfapps.us10-001.hana.ondemand.com";
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    Nombre: "",
    Tipo: "",
    PosicionX: "",
    PosicionY: ""
  });

  const [loading, setLoading] = useState(true);

  const tiposDisponibles = ["Proveedor", "Sucursal", "Oficina", "Almacén"];

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/location2`, {
          withCredentials: true,
        });
        const location = response.data.find(loc => loc.LOCATION_ID === parseInt(id));
        if (location) {
          setFormData({
            Nombre: location.NOMBRE,
            Tipo: location.TIPO,
            PosicionX: location.POSICIONX,
            PosicionY: location.POSICIONY
          });
        } else {
          alert("Ubicación no encontrada");
          navigate("/location");
        }
      } catch (error) {
        console.error("Error al obtener la ubicación:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/location2/${id}`, formData, {
        withCredentials: true
      });
      alert("Ubicación actualizada correctamente");
      navigate("/location");
    } catch (error) {
      console.error("Error al actualizar la ubicación:", error);
      alert("Error al actualizar la ubicación");
    }
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="container mt-4">
      <h2>Editar Ubicación</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Nombre</label>
          <input
            type="text"
            name="Nombre"
            value={formData.Nombre}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Tipo</label>
          <select
            name="Tipo"
            value={formData.Tipo}
            onChange={handleChange}
            className="form-control"
            required
          >
            <option value="">Seleccione un tipo</option>
            {tiposDisponibles.map((tipo) => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Posición X</label>
          <input
            type="number"
            name="PosicionX"
            value={formData.PosicionX}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Posición Y</label>
          <input
            type="number"
            name="PosicionY"
            value={formData.PosicionY}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary">Guardar cambios</button>
        <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate("/location")}>
          Cancelar
        </button>
      </form>
    </div>
  );
};

export default EditarLocation;
