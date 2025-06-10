import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Link, useNavigate } from "react-router-dom"; 
import axios from "axios";

const LocationListLayer = () => {
  const [locations, setLocations] = useState([]);
  const [filtradas, setFiltradas] = useState([]);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const porPagina = 10;
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://sapitos-backend.cfapps.us10-001.hana.ondemand.com";

  const navigate = useNavigate();

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/location2`, {
        withCredentials: true,
      });
      setLocations(response.data);
      setFiltradas(response.data);
    } catch (error) {
      console.error("Error al obtener ubicaciones:", error);
      alert("Error al obtener ubicaciones: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    const resultados = locations.filter((loc) =>
      loc.NOMBRE?.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      loc.TIPO?.toLowerCase().includes(terminoBusqueda.toLowerCase())
    );
    setFiltradas(resultados);
    setPaginaActual(1);
  }, [terminoBusqueda, locations]);

  const eliminarLocation = async (id) => {
    const confirmar = window.confirm("¿Estás seguro que deseas eliminar esta ubicación?");
    if (!confirmar) return;

    try {
      await axios.delete(`${API_BASE_URL}/location2/${id}`, {
        withCredentials: true
      });
      fetchAllData();
    } catch (error) {
      console.error("Error al eliminar ubicación:", error);
      alert("Error al eliminar la ubicación");
    }
  };

  const indiceUltimo = paginaActual * porPagina;
  const indicePrimero = indiceUltimo - porPagina;
  const actuales = filtradas.slice(indicePrimero, indiceUltimo);
  const totalPaginas = Math.ceil(filtradas.length / porPagina);

  return (
    <div className="card h-100 p-0 radius-12">
      <div className="card-header d-flex justify-content-between align-items-center py-16 px-24">
        <div className="d-flex align-items-center gap-3">
          <span className="text-md fw-medium text-secondary-light mb-0">Mostrar</span>
          <form className="navbar-search">
            <input
              type="text"
              className="bg-base h-40-px w-auto"
              placeholder="Buscar ubicaciones..."
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
            />
            <Icon icon="ion:search-outline" className="icon" />
          </form>
        </div>
        <Link to="/agregar-Location" className="btn btn-primary btn-sm">
          <Icon icon="ic:baseline-plus" className="icon text-xl" /> Agregar Ubicación
        </Link>
      </div>

      <div className="card-body p-24">
        {loading ? (
          <div className="text-center">Cargando ubicaciones...</div>
        ) : (
          <>
            <div className="table-responsive scroll-sm">
              <table className="table bordered-table sm-table mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {actuales.length > 0 ? (
                    actuales.map((loc, index) => (
                      <tr key={loc.LOCATION_ID}>
                        <td>{indicePrimero + index + 1}</td>
                        <td>{loc.NOMBRE}</td>
                        <td>{loc.TIPO}</td>
                        <td className="text-center">
                          <div className="d-flex align-items-center gap-10 justify-content-center">
                            <button
                              type="button"
                              onClick={() => navigate(`/editar-Location/${loc.LOCATION_ID}`)}
                              className="bg-success-focus text-success-600 w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                            >
                              <Icon icon="lucide:edit" />
                            </button>
                            <button
                              type="button"
                              onClick={() => eliminarLocation(loc.LOCATION_ID)}
                              className="bg-danger-focus text-danger-600 w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                            >
                              <Icon icon="fluent:delete-24-regular" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-4">
                        No se encontraron ubicaciones.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24 p-24">
              <div>
                <small className="text-muted">
                  Mostrando {indicePrimero + 1} a {Math.min(indiceUltimo, filtradas.length)} de {filtradas.length} registros
                </small>
              </div>
              {totalPaginas > 1 && (
                <nav className="d-flex align-items-center gap-2">
                  <button
                    className="btn btn-outline-primary btn-sm px-2.5 py-1"
                    onClick={() => setPaginaActual(1)}
                    disabled={paginaActual === 1}
                  >
                    <Icon icon="mdi:chevron-double-left" width="16" />
                  </button>
                  <button
                    className="btn btn-outline-primary btn-sm px-2.5 py-1"
                    onClick={() => setPaginaActual(paginaActual - 1)}
                    disabled={paginaActual === 1}
                  >
                    <Icon icon="mdi:chevron-left" width="16" />
                  </button>
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                    .filter(page => Math.abs(page - paginaActual) <= 2 || page === 1 || page === totalPaginas)
                    .map((page, index, array) => {
                      if (index > 0 && array[index - 1] !== page - 1) {
                        return [
                          <span key={`ellipsis-${page}`} className="px-1">...</span>,
                          <button
                            key={page}
                            className={`btn ${paginaActual === page ? 'btn-primary' : 'btn-outline-primary'} btn-sm px-2.5 py-1`}
                            onClick={() => setPaginaActual(page)}
                          >
                            {page}
                          </button>
                        ];
                      }
                      return (
                        <button
                          key={page}
                          className={`btn ${paginaActual === page ? 'btn-primary' : 'btn-outline-primary'} btn-sm px-2.5 py-1`}
                          onClick={() => setPaginaActual(page)}
                        >
                          {page}
                        </button>
                      );
                    })}
                  <button
                    className="btn btn-outline-primary btn-sm px-2.5 py-1"
                    onClick={() => setPaginaActual(paginaActual + 1)}
                    disabled={paginaActual === totalPaginas}
                  >
                    <Icon icon="mdi:chevron-right" width="16" />
                  </button>
                  <button
                    className="btn btn-outline-primary btn-sm px-2.5 py-1"
                    onClick={() => setPaginaActual(totalPaginas)}
                    disabled={paginaActual === totalPaginas}
                  >
                    <Icon icon="mdi:chevron-double-right" width="16" />
                  </button>
                </nav>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LocationListLayer;
