import { Icon } from "@iconify/react/dist/iconify.js";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { notify, NotificationType } from "./NotificationService";

const AddUserLayer = () => {
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [locations, setLocations] = useState([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState("");
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://sapitos-backend.cfapps.us10-001.hana.ondemand.com";
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "",
    correo: "",
    organizacion: "",
    contrasena: "",
    rol: "",
    location_id: "",
    diasordenprom: 0,
    valorordenprom: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const tipoMap = {
    proveedor: "Proveedor",
    oficina: "Oficina",
    almacen: "Almacén",
    sucursal: "Sucursal",
  };

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/location2`, {
          withCredentials: true
        });
        setLocations(response.data);
      } catch (error) {
        console.error("Error al cargar ubicaciones:", error);
        setError("Error al cargar ubicaciones");
      }
    };
    fetchLocations();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviewUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    setNuevoUsuario({ ...nuevoUsuario, [e.target.name]: e.target.value });
  };

  const agregarUsuario = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${API_BASE_URL}/users/register`, nuevoUsuario);
      notify("¡Usuario creado exitosamente!", NotificationType.SUCCESS);
      navigate("/usuarios");
    } catch (error) {
      const errorMsg = "Error al agregar usuario: " + (error.response?.data?.error || error.message);
      setError(errorMsg);
      notify(errorMsg, NotificationType.ERROR);
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
                      <label htmlFor="imageUpload" className="w-32-px h-32-px d-flex justify-content-center align-items-center bg-primary-50 text-primary-600 border border-primary-600 bg-hover-primary-100 text-lg rounded-circle">
                        <Icon icon="solar:camera-outline" className="icon" />
                      </label>
                    </div>
                    <div className="avatar-preview">
                      <div id="imagePreview" style={{ backgroundImage: imagePreviewUrl ? `url(${imagePreviewUrl})` : "" }}></div>
                    </div>
                  </div>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); agregarUsuario(); }}>
                  <div className="mb-20">
                    <label className="form-label">Nombre completo</label>
                    <input type="text" className="form-control radius-8" name="nombre" value={nuevoUsuario.nombre} onChange={handleInputChange} required />
                  </div>

                  <div className="mb-20">
                    <label className="form-label">Correo electrónico</label>
                    <input type="email" className="form-control radius-8" name="correo" value={nuevoUsuario.correo} onChange={handleInputChange} required />
                  </div>

                  <div className="mb-20">
                    <label className="form-label">Contraseña</label>
                    <input type="password" className="form-control radius-8" name="contrasena" value={nuevoUsuario.contrasena} onChange={handleInputChange} required />
                  </div>

                  <div className="mb-20">
                    <label className="form-label">Rol</label>
                    <select className="form-control radius-8" name="rol" value={nuevoUsuario.rol} onChange={handleInputChange} required>
                      <option value="">Seleccionar rol</option>
                      <option value="admin">Admin</option>
                      <option value="proveedor">Proveedor</option>
                      <option value="dueno">Dueño</option>
                      <option value="empleado">Empleado</option>
                    </select>
                  </div>

                  <div className="mb-20">
                    <label className="form-label">Tipo de ubicación</label>
                    <select className="form-control radius-8" value={tipoSeleccionado} onChange={(e) => {
                      setTipoSeleccionado(e.target.value);
                      setNuevoUsuario({ ...nuevoUsuario, location_id: "", organizacion: "" });
                    }}>
                      <option value="">Seleccionar tipo</option>
                      <option value="oficina">Oficina</option>
                      <option value="proveedor">Proveedor</option>
                      <option value="almacen">Almacén</option>
                      <option value="sucursal">Sucursal</option>
                    </select>
                  </div>

                  {tipoSeleccionado && (
                    <div className="mb-20">
                      <label className="form-label">Ubicación ({tipoSeleccionado})</label>
                      <select
                        className="form-control radius-8"
                        name="location_id"
                        value={nuevoUsuario.location_id}
                        onChange={(e) =>
                          setNuevoUsuario({
                            ...nuevoUsuario,
                            location_id: parseInt(e.target.value),
                            organizacion: e.target.options[e.target.selectedIndex].text,
                          })
                        }
                        required
                      >
                        <option value="">Seleccionar ubicación</option>
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
                    <button type="button" className="btn btn-outline-danger" onClick={() => window.history.back()}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? "Guardando..." : "Guardar"}
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

export default AddUserLayer;
