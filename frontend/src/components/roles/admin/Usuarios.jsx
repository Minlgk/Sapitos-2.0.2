import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Container, Row, Col, Card, Button, Form, Modal, 
  InputGroup, Badge, Spinner, Alert, ListGroup
} from "react-bootstrap";
import { 
  FaUserPlus, FaSearch, FaEdit, FaTrash, FaUser, FaEnvelope, 
  FaBuilding, FaShieldAlt, FaTimes, FaSave, FaUsers, FaCalendar, FaDollarSign 
} from "react-icons/fa";

const Usuarios = () => {
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://sapitos-backend.cfapps.us10-001.hana.ondemand.com";
  const [usuarios, setUsuarios] = useState([]);
  const [rolesMap, setRolesMap] = useState({});
  const [nuevoUsuario, setNuevoUsuario] = useState({ 
    nombre: "", correo: "", organizacion: "", contrasena: "", rol: "", diasordenprom: 0, valorordenprom: 0
  });
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usuariosRes, rolesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/users/getUsers`),
          axios.get(`${API_BASE_URL}/rol/getRoles`),
        ]);

        const rolesDict = {};
        rolesRes.data.forEach(r => {
          rolesDict[r.ROL_ID] = r.NOMBRE;
        });
        setRolesMap(rolesDict);

        const usuariosConRol = usuariosRes.data.map(u => ({
          ...u,
          rol: rolesDict[u.ROL_ID] || "Desconocido",
        }));

        setUsuarios(usuariosConRol);
      } catch (error) {
        console.error("Error al obtener usuarios o roles:", error);
        setError('Error al obtener usuarios o roles: ' + (error.response?.data?.error || error.message));
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    setError(null);
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    if (modalMode === "edit") {
      setUsuarioEditando({ ...usuarioEditando, [e.target.name]: e.target.value });
    } else {
      setNuevoUsuario({ ...nuevoUsuario, [e.target.name]: e.target.value });
    }
  };

  const agregarUsuario = async () => {
    try {
      await axios.post(`${API_BASE_URL}/users/register`, nuevoUsuario); 
      setNuevoUsuario({ nombre: "", correo: "", organizacion: "", contrasena: "", rol: "", diasordenprom: 0, valorordenprom: 0 });
      setShowModal(false);
      window.location.reload(); // para refrescar y volver a cargar roles también
    } catch (error) {
      console.error("Error al agregar usuario:", error);
      setError('Error al agregar usuario: ' + (error.response?.data?.error || error.message));
    }
  };

  const eliminarUsuario = async (correo) => {
    try {
      await axios.delete(`${API_BASE_URL}/users/deleteUser`, { data: { correo } });
      window.location.reload();
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
    }
  };

  const activarEdicion = (usuario) => {
    setModalMode("edit");
    setUsuarioEditando({ ...usuario });
    setShowModal(true);
  };

  const openAddModal = () => {
    setModalMode("add");
    setNuevoUsuario({ nombre: "", correo: "", organizacion: "", contrasena: "", rol: "", diasordenprom: 0, valorordenprom: 0 });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setUsuarioEditando(null);
  };

  const guardarCambios = async () => {
    try {
      await axios.put(`${API_BASE_URL}/users/updateUser`, usuarioEditando);
      setShowModal(false);
      setUsuarioEditando(null);
      window.location.reload();
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
    }
  };

  const usuariosFiltrados = Array.isArray(usuarios) ? usuarios.filter(usuario =>
    usuario?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario?.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (usuario?.rol && usuario?.rol.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];

  const getBadgeVariant = (rol) => {
    switch(rol?.toLowerCase()) {
      case 'admin': return 'danger';
      case 'proveedor': return 'success';
      case 'cliente': return 'info';
      case 'dueno': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <div className="bg-light min-vh-100 py-5">
      <Container>
        {/* Encabezado */}
        <Row className="mb-4 align-items-center">
          <Col>
            <h1 className="display-5 fw-bold text-primary d-flex align-items-center">
              <FaUsers className="me-3" /> Gestión de Usuarios
            </h1>
            <p className="text-muted">Administra los usuarios del sistema</p>
          </Col>
          <Col xs="auto">
            <Button variant="primary" size="lg" onClick={openAddModal} className="d-flex align-items-center shadow-sm">
              <FaUserPlus className="me-2" /> Agregar Usuario
            </Button>
          </Col>
        </Row>

        {/* Buscador */}
        <Card className="shadow-sm mb-4 border-0">
          <Card.Body>
            <InputGroup>
              <InputGroup.Text className="bg-white"><FaSearch className="text-muted" /></InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Buscar usuarios por nombre, correo o rol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-start-0"
              />
              {searchTerm && (
                <Button variant="outline-secondary" onClick={() => setSearchTerm("")} className="border-start-0">
                  <FaTimes />
                </Button>
              )}
            </InputGroup>
          </Card.Body>
        </Card>

        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <p className="text-muted">Cargando usuarios...</p>
          </div>
        )}
        
        {error && (
          <Alert variant="danger" className="mb-4">
            <Alert.Heading>Error</Alert.Heading>
            <p>{error}</p>
          </Alert>
        )}

        {!loading && (
          <Row xs={1} md={2} lg={3} xl={4} className="g-4">
            {usuariosFiltrados.length > 0 ? (
              usuariosFiltrados.map((usuario) => (
                <Col key={usuario.correo}>
                  <Card className="h-100 shadow-sm border-top border-primary border-4 hover-shadow">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="d-flex align-items-center">
                          <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                            <FaUser className="text-primary" />
                          </div>
                          <Card.Title className="mb-0 fs-5">{usuario?.nombre}</Card.Title>
                        </div>
                        <div>
                          <Badge bg={getBadgeVariant(usuario?.rol)} className="ms-2">
                            {usuario.rol || "Sin rol"}
                          </Badge>
                        </div>
                      </div>
                      
                      <ListGroup variant="flush" className="small">
                        <ListGroup.Item className="d-flex align-items-center px-0">
                          <FaEnvelope className="text-muted me-2" />
                          <span className="text-truncate">{usuario.correo}</span>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex align-items-center px-0">
                          <FaBuilding className="text-muted me-2" />
                          <span>{usuario.organizacion || "No especificada"}</span>
                        </ListGroup.Item>
                      </ListGroup>
                      
                      <div className="d-flex justify-content-end mt-3 gap-2">
                        <Button variant="outline-primary" size="sm" onClick={() => activarEdicion(usuario)} className="d-flex align-items-center">
                          <FaEdit className="me-1" /> Editar
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => eliminarUsuario(usuario.correo)} className="d-flex align-items-center">
                          <FaTrash className="me-1" /> Eliminar
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            ) : (
              <Col xs={12}>
                <Card className="text-center py-5 shadow-sm border-0">
                  <Card.Body>
                    <FaSearch className="display-1 text-muted mb-3" />
                    <Card.Title>No se encontraron usuarios</Card.Title>
                    <Card.Text className="text-muted">
                      No hay usuarios que coincidan con tu búsqueda o no hay usuarios registrados.
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default Usuarios;
