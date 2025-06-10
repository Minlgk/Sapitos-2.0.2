import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AddArticuloLayer = () => {
  const [nuevoArticulo, setNuevoArticulo] = useState({
    Nombre: "",
    Categoria: "",
    PrecioProveedor: "",
    PrecioVenta: "",
    Temporada: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://sapitos-backend.cfapps.us10-001.hana.ondemand.com";

  const handleInputChange = (e) => {
    setNuevoArticulo({ ...nuevoArticulo, [e.target.name]: e.target.value });
  };

  const agregarArticulo = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${API_BASE_URL}/articulo`, nuevoArticulo, {
        withCredentials: true,
      });
      navigate("/articulos");
    } catch (error) {
      console.error("Error al agregar artículo:", error);
      setError("Error al agregar artículo: " + (error.response?.data?.error || error.message));
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
                <h6 className="text-md text-primary-light mb-16">Nuevo artículo</h6>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    agregarArticulo();
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
                      value={nuevoArticulo.Nombre}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="mb-20">
                    <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                      Categoría <span className="text-danger-600">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control radius-8"
                      name="Categoria"
                      value={nuevoArticulo.Categoria}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="mb-20">
                    <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                      Precio del proveedor <span className="text-danger-600">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control radius-8"
                      name="PrecioProveedor"
                      value={nuevoArticulo.PrecioProveedor}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="mb-20">
                    <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                      Precio de venta <span className="text-danger-600">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control radius-8"
                      name="PrecioVenta"
                      value={nuevoArticulo.PrecioVenta}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="mb-20">
                    <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                      Temporada <span className="text-danger-600">*</span>
                    </label>
                    <select
                      className="form-control radius-8 form-select"
                      name="Temporada"
                      value={nuevoArticulo.Temporada}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccionar temporada</option>
                      <option value="Primavera">Primavera</option>
                      <option value="Verano">Verano</option>
                      <option value="Otoño">Otoño</option>
                      <option value="Invierno">Invierno</option>
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

export default AddArticuloLayer;
