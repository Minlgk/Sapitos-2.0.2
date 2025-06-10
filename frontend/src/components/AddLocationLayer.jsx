import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AddLocationLayer = () => {
  const [nuevaLocation, setNuevaLocation] = useState({
    Nombre: "",
    Tipo: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://sapitos-backend.cfapps.us10-001.hana.ondemand.com";

  const handleInputChange = (e) => {
    setNuevaLocation({ ...nuevaLocation, [e.target.name]: e.target.value });
  };

  const agregarLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      const datosParaEnviar = {
        ...nuevaLocation,
        PosicionX: 0,
        PosicionY: 0,
        FechaCreado: new Date().toISOString().split("T")[0], // formato 'YYYY-MM-DD'
      };

      await axios.post(`${API_BASE_URL}/location2/`, datosParaEnviar, {
        withCredentials: true,
      });

      navigate("/location");
    } catch (error) {
      console.error("Error al agregar ubicación:", error);
      setError("Error al agregar ubicación: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card h-100 p-0 radius-12">
      <div className="card-body p-24">
        <div className="row justify-content-center">
          <div className="col-xxl-6 col-xl-8 col-lg-10">
            <div className="card border">
              <div className="card-body">
                <h6 className="text-md text-primary-light mb-16">Nueva ubicación</h6>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    agregarLocation();
                  }}
                >
                  <div className="mb-20">
                    <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                      Nombre <span className="text-danger-600">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control radius-8"
                      name="Nombre"
                      value={nuevaLocation.Nombre}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="mb-20">
                    <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                      Tipo de ubicación <span className="text-danger-600">*</span>
                    </label>
                    <select
                      className="form-control radius-8 form-select"
                      name="Tipo"
                      value={nuevaLocation.Tipo}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccionar tipo</option>
                      <option value="Oficina">Oficina</option>
                      <option value="Proveedor">Proveedor</option>
                      <option value="Sucursal">Sucursal</option>
                      <option value="Almacén">Almacén</option>
                    </select>
                  </div>

                  <div className="d-flex align-items-center justify-content-center gap-3">
                    <button
                      type="button"
                      className="border border-danger-600 bg-hover-danger-200 text-danger-600 text-md px-56 py-11 radius-8"
                      onClick={() => window.history.back()}
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className="btn btn-primary border border-primary-600 text-md px-56 py-12 radius-8 d-flex align-items-center justify-content-center gap-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          Guardando...
                        </>
                      ) : (
                        "Guardar"
                      )}
                    </button>
                  </div>

                  {error && <div className="mt-3 text-danger text-center">{error}</div>}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLocationLayer;
