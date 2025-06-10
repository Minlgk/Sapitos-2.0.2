import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Link, useNavigate } from "react-router-dom"; 
import axios from "axios";
import { notify, NotificationType } from "./NotificationService";
import Swal from "sweetalert2";

const UsersListLayer = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const usuariosPorPagina = 10;
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://sapitos-backend.cfapps.us10-001.hana.ondemand.com";


  const navigate = useNavigate(); 

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const usuariosResponse = await axios.get(`${API_BASE_URL}/users/getUsers`, {
        withCredentials: true
      });

      const rolesResponse = await axios.get(`${API_BASE_URL}/rol/getRoles`);
      const rolesMap = {};
      rolesResponse.data.forEach((r) => {
        rolesMap[r.ROL_ID?.toString()] = r.NOMBRE;
      });

      const locationsResponse = await axios.get(`${API_BASE_URL}/location2`);
      const locationsMap = {};
      locationsResponse.data.forEach((l) => {
        locationsMap[l.LOCATION_ID?.toString()] = l.NOMBRE;
      });

      const usuariosConDatos = usuariosResponse.data.map(usuario => {
        const rolId = usuario.rolId;
        const locationId = usuario.locationId;

        return {
          ...usuario,
          rol: rolesMap[rolId?.toString()] || "Sin rol",
          locationNombre: locationsMap[locationId?.toString()] || "Sin ubicación"
        };
      });

      setUsuarios(usuariosConDatos);
      setUsuariosFiltrados(usuariosConDatos);
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        alert("No autorizado. Por favor inicia sesión como administrador o dueño.");
        window.location.href = "/";
      } else {
        console.error("Error al obtener usuarios:", error);
        alert("Error al obtener usuarios: " + (error.response?.data?.error || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const eliminarUsuario = async (correo) => {
    try {
      const result = await Swal.fire({
        title: "¿Eliminar usuario?",
        text: "Esta acción no se puede deshacer",
        icon: "warning",
        iconColor: '#dc3545',
        showCancelButton: true,
        confirmButtonText: "Sí, borrar",
        cancelButtonText: "Cancelar",
        customClass: {
          popup: 'swal-compact',
          title: 'text-lg mb-2',
          htmlContainer: 'text-sm mb-3',
          actions: 'd-flex gap-3 justify-content-center mt-3',
          confirmButton: 'px-4 py-2 border border-2 border-danger-600 bg-danger-600 text-white text-sm fw-semibold rounded',
          cancelButton: 'px-4 py-2 border border-2 border-secondary-600 bg-white text-secondary-600 text-sm fw-semibold rounded'
        },
        buttonsStyling: false,
        width: '330px',
        padding: '1rem'
      });

      if (result.isConfirmed) {
        await axios.delete(`${API_BASE_URL}/users/deleteUser/${correo}`, {
          withCredentials: true
        });
        notify("Usuario eliminado exitosamente", NotificationType.SUCCESS);
        fetchAllData();
      }
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      notify("No se pudo eliminar el usuario", NotificationType.ERROR);
    }
  };

  useEffect(() => {
    const filtrados = usuarios.filter((usuario) =>
      usuario.nombre?.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      usuario.correo?.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      usuario.rol?.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      usuario.locationNombre?.toLowerCase().includes(terminoBusqueda.toLowerCase())
    );
    setUsuariosFiltrados(filtrados);
    setPaginaActual(1);
  }, [terminoBusqueda, usuarios]);

  const indiceUltimoUsuario = paginaActual * usuariosPorPagina;
  const indicePrimerUsuario = indiceUltimoUsuario - usuariosPorPagina;
  const usuariosActuales = usuariosFiltrados.slice(indicePrimerUsuario, indiceUltimoUsuario);
  const totalPaginas = Math.ceil(usuariosFiltrados.length / usuariosPorPagina);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  return (
    <div className="card h-100 p-0 radius-12">
      <div className="card-header d-flex justify-content-between align-items-center py-16 px-24">
        <div className="d-flex align-items-center gap-3">
          <span className="text-md fw-medium text-secondary-light mb-0">Mostrar</span>
          <form className="navbar-search">
            <input
              type="text"
              id="buscadorUsuarios"
              className="bg-base h-40-px w-auto"
              placeholder="Buscar usuarios..."
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
            />
            <Icon icon="ion:search-outline" className="icon" />
          </form>
        </div>
        <Link to="/agregar-usuario" id="agregarUsuarioBtn" className="btn btn-primary btn-sm">
          <Icon icon="ic:baseline-plus" className="icon text-xl" /> Agregar Usuario
        </Link>
      </div>

      <div className="card-body p-24">
        {loading ? (
          <div className="text-center">Cargando usuarios...</div>
        ) : (
          <>
            <div className="table-responsive scroll-sm">
              <table className="table bordered-table sm-table mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Ubicación</th>
                    <th>Rol</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosActuales.length > 0 ? (
                    usuariosActuales.map((usuario, index) => (
                      <tr key={usuario.correo}>
                        <td>{indicePrimerUsuario + index + 1}</td>
                        <td>{usuario.nombre}</td>
                        <td>{usuario.correo}</td>
                        <td>{usuario.locationNombre}</td>
                        <td>{usuario.rol}</td>
                        <td className="text-center">
                          <div className="d-flex align-items-center gap-10 justify-content-center">
                            <button
                              id={`editarUsuario-${index}`} 
                              type="button"
                              onClick={() => navigate(`/editar-usuario/${usuario.correo}`)}
                              className="bg-success-focus bg-hover-success-200 text-success-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                            >
                              <Icon icon="lucide:edit" className="menu-icon" />
                            </button>
                            <button
                              id={`eliminarUsuario-${index}`}
                              type="button"
                              onClick={() => eliminarUsuario(usuario.correo)}
                              className="remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                            >
                              <Icon icon="fluent:delete-24-regular" className="menu-icon" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-4">
                        No se encontraron usuarios.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24 p-24">
              <div>
                <small className="text-muted">
                  Mostrando {indicePrimerUsuario + 1} a {Math.min(indiceUltimoUsuario, usuariosFiltrados.length)} de {usuariosFiltrados.length} registros
                </small>
              </div>
              {totalPaginas > 1 && (
                <nav className="d-flex align-items-center gap-2">
                  <button
                    className="btn btn-outline-primary btn-sm px-2.5 py-1"
                    onClick={() => cambiarPagina(1)}
                    disabled={paginaActual === 1}
                  >
                    <Icon icon="mdi:chevron-double-left" width="16" />
                  </button>
                  <button
                    className="btn btn-outline-primary btn-sm px-2.5 py-1"
                    onClick={() => cambiarPagina(paginaActual - 1)}
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
                            onClick={() => cambiarPagina(page)}
                          >
                            {page}
                          </button>
                        ];
                      }
                      return (
                        <button
                          key={page}
                          className={`btn ${paginaActual === page ? 'btn-primary' : 'btn-outline-primary'} btn-sm px-2.5 py-1`}
                          onClick={() => cambiarPagina(page)}
                        >
                          {page}
                        </button>
                      );
                    })}
                  <button
                    className="btn btn-outline-primary btn-sm px-2.5 py-1"
                    onClick={() => cambiarPagina(paginaActual + 1)}
                    disabled={paginaActual === totalPaginas}
                  >
                    <Icon icon="mdi:chevron-right" width="16" />
                  </button>
                  <button
                    className="btn btn-outline-primary btn-sm px-2.5 py-1"
                    onClick={() => cambiarPagina(totalPaginas)}
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

export default UsersListLayer;
