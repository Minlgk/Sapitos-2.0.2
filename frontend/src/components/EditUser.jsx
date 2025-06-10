import { Icon } from "@iconify/react/dist/iconify.js";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const EditUserLayer = () => {
  const { userId } = useParams();
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://sapitos-backend.cfapps.us10-001.hana.ondemand.com";

  const [usuario, setUsuario] = useState({
    nombre: "",
    correo: "",
    organizacion: "",
    contrasena: "",
    rol: "",
    diasordenprom: 0,
    valorordenprom: 0,
    locationId: null,
  });
  const [locations, setLocations] = useState([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const tipoMap = {
    proveedor: "Proveedor",
    oficina: "Oficina",
    almacen: "Almacén",
    sucursal: "Sucursal",
  };

  useEffect(() => {
    const fetchUsuario = async () => {
      if (!userId) return;
      try {
        setLoadingData(true);
        const response = await axios.get(`${API_BASE_URL}/users/getUsers`, {
          withCredentials: true,
        });
        const usuarioEncontrado = response.data.find(user => user.correo === userId);
        if (!usuarioEncontrado) throw new Error("Usuario no encontrado");

        setUsuario({
          nombre: usuarioEncontrado.nombre || "",
          correo: usuarioEncontrado.correo || "",
          organizacion: usuarioEncontrado.organizacion || "",
          contrasena: "",
          rol: usuarioEncontrado.rol || "",
          diasordenprom: usuarioEncontrado.diasOrdenProm || 0,
          valorordenprom: usuarioEncontrado.valorOrdenProm || 0,
          locationId: usuarioEncontrado.locationId || null,
        });

        if (usuarioEncontrado.imagen) {
          setImagePreviewUrl(usuarioEncontrado.imagen);
        }
      } catch (error) {
        console.error("Error al cargar datos del usuario:", error);
        setError("Error al cargar los datos del usuario: " + (error.response?.data?.error || error.message));
      } finally {
        setLoadingData(false);
      }
    };

    const fetchLocations = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/location2`, {
          withCredentials: true,
        });
        setLocations(res.data);
      } catch (err) {
        console.error("Error al obtener locations:", err);
      }
    };

    fetchUsuario();
    fetchLocations();
  }, [userId]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    setUsuario({ ...usuario, [e.target.name]: e.target.value });
  };

  const actualizarUsuario = async () => {
    setLoading(true);
    setError(null);
    try {
      const datosActualizacion = {
        correo: usuario.correo,
        nombre: usuario.nombre,
        organizacion: usuario.organizacion,
        rol: usuario.rol,
        location_id: usuario.locationId, // clave esperada por el backend
      };

      if (usuario.contrasena) {
        datosActualizacion.contrasena = usuario.contrasena;
      }

      if (imagePreviewUrl && imagePreviewUrl !== usuario.imagen) {
        datosActualizacion.imagen = imagePreviewUrl;
      }

      await axios.put(`${API_BASE_URL}/users/updateUser`, datosActualizacion, {
        withCredentials: true,
      });

      navigate("/usuarios");
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      setError("Error al actualizar usuario: " + (error.response?.data?.error || error.message));
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
                <h6 className="text-md text-primary-light mb-16">Imagen de perfil</h6>

                {loadingData ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-2">Cargando datos del usuario...</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-24 mt-16">
                      <div className="avatar-upload">
                        <div className="avatar-edit position-absolute bottom-0 end-0 me-24 mt-16 z-1 cursor-pointer">
                          <input
                            type="file"
                            id="imageUpload"
                            accept=".png, .jpg, .jpeg"
                            hidden
                            onChange={handleImageChange}
                          />
                          <label
                            htmlFor="imageUpload"
                            className="w-32-px h-32-px d-flex justify-content-center align-items-center bg-primary-50 text-primary-600 border border-primary-600 bg-hover-primary-100 text-lg rounded-circle"
                          >
                            <Icon icon="solar:camera-outline" className="icon" />
                          </label>
                        </div>
                        <div className="avatar-preview">
                          <div
                            id="imagePreview"
                            style={{
                              backgroundImage: imagePreviewUrl ? `url(${imagePreviewUrl})` : "",
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); actualizarUsuario(); }}>
                      <div className="mb-20">
                        <label className="form-label">Nombre completo</label>
                        <input
                          type="text"
                          className="form-control radius-8"
                          name="nombre"
                          value={usuario.nombre}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="mb-20">
                        <label className="form-label">Correo electrónico</label>
                        <input
                          type="email"
                          className="form-control radius-8"
                          name="correo"
                          value={usuario.correo}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="mb-20">
                        <label className="form-label">Contraseña</label>
                        <input
                          type="password"
                          className="form-control radius-8"
                          name="contrasena"
                          value={usuario.contrasena}
                          onChange={handleInputChange}
                          placeholder="Dejar en blanco para no cambiar"
                        />
                      </div>

                      <div className="mb-20">
                        <label className="form-label">Rol</label>
                        <select
                          className="form-control radius-8"
                          name="rol"
                          value={usuario.rol}
                          onChange={handleInputChange}
                        >
                          <option value="">Seleccionar rol</option>
                          <option value="admin">Admin</option>
                          <option value="proveedor">Proveedor</option>
                          <option value="dueno">Dueño</option>
                          <option value="empleado">Empleado</option>
                        </select>
                      </div>

                      <div className="mb-20">
                        <label className="form-label">Tipo de ubicación</label>
                        <select
                          className="form-control radius-8"
                          value={tipoSeleccionado}
                          onChange={(e) => {
                            setTipoSeleccionado(e.target.value);
                            setUsuario({ ...usuario, organizacion: "", locationId: null });
                          }}
                        >
                          <option value="">Seleccionar tipo</option>
                          <option value="oficina">Oficina</option>
                          <option value="proveedor">Proveedor</option>
                          <option value="almacen">Almacén</option>
                          <option value="sucursal">Sucursal</option>
                        </select>
                      </div>

                      {tipoSeleccionado && (
                        <div className="mb-20">
                          <label className="form-label">Organización ({tipoSeleccionado})</label>
                          <select
                            className="form-control radius-8"
                            name="locationId"
                            value={usuario.locationId || ""}
                            onChange={(e) =>
                              setUsuario({
                                ...usuario,
                                locationId: parseInt(e.target.value),
                                organizacion: e.target.options[e.target.selectedIndex].text,
                              })
                            }
                          >
                            <option value="">Seleccionar organización</option>
                            {locations
                              .filter((loc) => {
                                const tipoDB = (loc.TIPO || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                                const tipoSel = (tipoMap[tipoSeleccionado] || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                                return tipoDB === tipoSel;
                              })
                              .map((loc) => (
                                <option key={loc.LOCATION_ID} value={loc.LOCATION_ID}>
                                  {loc.NOMBRE}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}

                      <div className="d-flex justify-content-between mt-4">
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => navigate("/usuarios")}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={loading}
                        >
                          {loading ? "Guardando..." : "Actualizar"}
                        </button>
                      </div>

                      {error && (
                        <div className="mt-3 text-danger text-center">{error}</div>
                      )}
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditUserLayer;
