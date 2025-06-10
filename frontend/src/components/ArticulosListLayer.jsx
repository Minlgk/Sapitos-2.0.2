import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const ArticulosListLayer = () => {
  const [articulos, setArticulos] = useState([]);
  const [articulosFiltrados, setArticulosFiltrados] = useState([]);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const articulosPorPagina = 10;
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://sapitos-backend.cfapps.us10-001.hana.ondemand.com";

  const navigate = useNavigate();

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/articulo`, {
        withCredentials: true,
      });
      setArticulos(response.data);
      setArticulosFiltrados(response.data);
    } catch (error) {
      console.error("Error al obtener artículos:", error);
      alert("Error al obtener artículos: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const eliminarArticulo = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/articulo/${id}`, {
        withCredentials: true
      });
      fetchAllData();
    } catch (error) {
      console.error("Error al eliminar artículo:", error);
    }
  };

  useEffect(() => {
    const filtrados = articulos.filter((art) =>
      art.NOMBRE?.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      art.CATEGORIA?.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      art.TEMPORADA?.toLowerCase().includes(terminoBusqueda.toLowerCase())
    );
    setArticulosFiltrados(filtrados);
    setPaginaActual(1);
  }, [terminoBusqueda, articulos]);

  const indiceUltimo = paginaActual * articulosPorPagina;
  const indicePrimero = indiceUltimo - articulosPorPagina;
  const articulosActuales = articulosFiltrados.slice(indicePrimero, indiceUltimo);
  const totalPaginas = Math.ceil(articulosFiltrados.length / articulosPorPagina);

  return (
    <div className="card h-100 p-0 radius-12">
      <div className="card-header d-flex justify-content-between align-items-center py-16 px-24">
        <div className="d-flex align-items-center gap-3">
          <span className="text-md fw-medium text-secondary-light mb-0">Mostrar</span>
          <form className="navbar-search">
            <input
              type="text"
              className="bg-base h-40-px w-auto"
              placeholder="Buscar artículos..."
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
            />
            <Icon icon="ion:search-outline" className="icon" />
          </form>
        </div>
        <Link to="/agregar-articulo" className="btn btn-primary btn-sm">
          <Icon icon="ic:baseline-plus" className="icon text-xl" /> Agregar Artículo
        </Link>
      </div>

      <div className="card-body p-24 d-flex flex-column" style={{ minHeight: '60vh' }}>
        {loading ? (
          <div className="text-center">Cargando artículos...</div>
        ) : (
          <>
            <div className="table-responsive scroll-sm flex-grow-1" style={{ minHeight: '50vh', maxHeight: '65vh', overflowY: 'auto' }}>
              <table className="table bordered-table sm-table mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Precio Proveedor</th>
                    <th>Precio Venta</th>
                    <th>Temporada</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {articulosActuales.length > 0 ? (
                    articulosActuales.map((art, index) => (
                      <tr key={art.ARTICULO_ID}>
                        <td>{indicePrimero + index + 1}</td>
                        <td>{art.NOMBRE}</td>
                        <td>{art.CATEGORIA}</td>
                        <td>${art.PRECIOPROVEEDOR}</td>
                        <td>${art.PRECIOVENTA}</td>
                        <td>{art.TEMPORADA}</td>
                        <td className="text-center">
                          <div className="d-flex align-items-center gap-10 justify-content-center">
                            <button
                              type="button"
                              onClick={() => navigate(`/editar-articulo/${art.ARTICULO_ID}`)}
                              className="bg-success-focus text-success-600 w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                            >
                              <Icon icon="lucide:edit" />
                            </button>
                            <button
                              type="button"
                              onClick={() => eliminarArticulo(art.ARTICULO_ID)}
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
                      <td colSpan="7" className="text-center text-muted py-4">
                        No se encontraron artículos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24 p-24">
              <div>
                <small className="text-muted">
                  Mostrando {indicePrimero + 1} a {Math.min(indiceUltimo, articulosFiltrados.length)} de {articulosFiltrados.length} registros
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

export default ArticulosListLayer;
