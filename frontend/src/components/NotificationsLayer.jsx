import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import axios from "axios";
import { notify, NotificationType } from "./NotificationService";
import { useNavigate } from "react-router-dom";
import getCookie from "../utils/cookies";

// Función para formatear fecha de manera amigable
const formatearFechaRelativa = (fechaStr) => {
  if (!fechaStr) return '';
  
  try {
    const fecha = new Date(fechaStr);
    const ahora = new Date();
    
    // Si es inválida o fecha futura, mostrar la fecha formatada normal
    if (isNaN(fecha.getTime()) || fecha > ahora) {
      return fecha.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    const diferencia = ahora - fecha;
    
    // Menos de un minuto
    if (diferencia < 60 * 1000) {
      return 'hace unos segundos';
    }
    
    // Menos de una hora
    if (diferencia < 60 * 60 * 1000) {
      const minutos = Math.floor(diferencia / (60 * 1000));
      return `hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
    }
    
    // Menos de un día
    if (diferencia < 24 * 60 * 60 * 1000) {
      const horas = Math.floor(diferencia / (60 * 60 * 1000));
      return `hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    }
    
    // Menos de una semana
    if (diferencia < 7 * 24 * 60 * 60 * 1000) {
      const dias = Math.floor(diferencia / (24 * 60 * 60 * 1000));
      return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
    }
    
    // Más antiguo - mostrar fecha formateada
    return fecha.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (e) {
    console.error("Error al formatear fecha:", fechaStr, e);
    return fechaStr || 'Fecha desconocida';
  }
};


const Alert = ({ type, title, description, fecha, orden_id, usuario_id, onDelete }) => {
  const navigate = useNavigate();
  
  // Determinar clases CSS basadas en el tipo
  const getAlertClasses = () => {
    switch(type) {
      case 'success': return 'alert-success border-success';
      case 'danger': return 'alert-danger border-danger';
      case 'warning': return 'alert-warning border-warning';
      case 'info': return 'alert-info border-info';
      default: return 'alert-primary border-primary';
    }
  };
  
  // Determinar icono basado en el tipo
  const getIcon = () => {
    switch(type) {
      case 'success': return 'mdi:check-circle-outline';
      case 'danger': return 'mdi:alert-circle-outline';
      case 'warning': return 'mdi:alert-outline';
      case 'info': return 'mdi:information-outline';
      default: return 'mdi:bell-outline';
    }
  };
  
  // Formatear la fecha de manera relativa
  const fechaFormateada = formatearFechaRelativa(fecha);
  
  // Determinar si es una notificación de pedido por la descripción
  const esPedido = orden_id || description.includes('Orden #') || description.includes('orden #') || 
                  description.includes('pedido') || description.includes('Pedido');
  
  // Extraer el ID de la orden de la descripción si no viene explícito
  let ordenIdFromDesc = null;
  if (!orden_id && esPedido) {
    const match = description.match(/[Oo]rden #?(\d+)/);
    if (match && match[1]) {
      ordenIdFromDesc = match[1];
    }
  }

  const handleClick = () => {
    // Solo navegar si es un pedido
    if (orden_id) {
      navigate(`/admin/pedidos/detalle/${orden_id}`);
    } else if (ordenIdFromDesc) {
      navigate(`/admin/pedidos/detalle/${ordenIdFromDesc}`);
    } else if (usuario_id) {
      navigate(`/admin/usuarios`);
    }
  };
  
  return (
    <div className={`alert ${getAlertClasses()} p-3 mb-0 shadow-sm`}>
      <div className="d-flex align-items-start">
        <div className="me-3 pt-1">
          <Icon icon={getIcon()} className="fs-5" />
        </div>
        <div className="flex-grow-1">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="fw-bold mb-1">{title}</h6>
            <button 
              className="btn-close ms-2" 
              onClick={(e) => { 
                e.stopPropagation();
                onDelete();
              }}
              aria-label="Close"
            ></button>
          </div>
          <p className="mb-1 text-wrap">{description}</p>
          <div className="d-flex justify-content-between align-items-center mt-2">
            <small className="text-muted">{fechaFormateada}</small>
            
            {/* Solo mostrar enlace si es una notificación de pedido */}
            {(esPedido || orden_id || ordenIdFromDesc) && (
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={handleClick}
              >
                Ver Pedido
                <Icon icon="heroicons:arrow-small-right" className="ms-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationsLayer = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://sapitos-backend.cfapps.us10-001.hana.ondemand.com";

  useEffect(() => {
    fetchNotifications();
    
    // Configurar intervalo para actualizar las notificaciones cada 2 minutos
    const interval = setInterval(fetchNotifications, 2 * 60 * 1000);
    
    // Limpiar intervalo al desmontar el componente
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Obtener datos de usuario desde la cookie
      const userInfo = getCookie("UserData");
      let locationId;
      
      if (userInfo) {
        // Si userInfo es un string, parsearlo a objeto
        const userData = typeof userInfo === 'string' ? JSON.parse(userInfo) : userInfo;
        locationId = userData?.LOCATION_ID || userData?.locationId;
      }
      
      try {
        // Usar el endpoint correcto para obtener alertas
        let url = '/alertas';
        
        // Si tenemos un location_id, lo añadimos como filtro
        if (locationId) {
          url = `/alertas?location_id=${locationId}`;
        }
        
        console.log('Conectando al endpoint:', url);
        
        const response = await axios.get(url, {
          withCredentials: true
        });
        
        console.log('Respuesta del servidor:', response);
        
        if (response.data !== undefined) {
          console.log('Tipo de datos recibidos:', typeof response.data);
          console.log('Es array?', Array.isArray(response.data));
          console.log('Longitud de datos:', Array.isArray(response.data) ? response.data.length : 'No es un array');
          console.log('Datos recibidos:', response.data);
          
          // Obtener el array de alertas - ahora el backend devuelve directamente el array
          const alertsData = response.data;
          
          if (Array.isArray(alertsData) && alertsData.length > 0) {
            // Procesar los datos para que tengan todos los campos necesarios
            const processedData = alertsData.map(item => {
              // Asegurarse de que cada alerta tenga un tipo apropiado
              let tipo = item.tipo || 'primary';
              if (!tipo) {
                // Determinar el tipo basado en la prioridad si existe
                const prioridad = item.prioridad?.toUpperCase();
                if (prioridad === 'ALTA' || prioridad === 'HIGH') {
                  tipo = 'danger';
                } else if (prioridad === 'MEDIA' || prioridad === 'MEDIUM') {
                  tipo = 'warning';
                } else if (prioridad === 'BAJA' || prioridad === 'LOW') {
                  tipo = 'info';
                }
                
                // También determinar por descripción si corresponde
                const desc = (item.descripcion || '').toLowerCase();
                if (desc.includes('error') || desc.includes('fallo') || desc.includes('agotado')) {
                  tipo = 'danger';
                } else if (desc.includes('completado') || desc.includes('exitoso')) {
                  tipo = 'success';
                } else if (desc.includes('pendiente')) {
                  tipo = 'warning';
                }
              }
              
              return {
                id: item.id,
                tipo,
                titulo: item.titulo || 'Alerta',
                descripcion: item.descripcion || '',
                fecha: item.fecha,
                orden_id: item.orden_id,
                usuario_id: item.usuario_id,
                prioridad: item.prioridad
              };
            });
            
            setNotifications(processedData);
          } else {
            setNotifications([]);
            console.log('No se encontraron alertas o el formato es incorrecto');
          }
          
          setUsingMockData(false);
        } else {
          console.error('No se recibieron datos válidos del servidor');
          throw new Error('No se recibieron datos válidos');
        }
      } catch (error) {
        console.error('Error conectando al backend:', error.message);
        notify('Error al cargar notificaciones', NotificationType.ERROR);
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      notify('Error al cargar las notificaciones', NotificationType.ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await axios.delete(`/alertas/${id}`, {
        withCredentials: true
      });
      
      setNotifications(notifications.filter(notif => notif.id !== id));
      notify('Notificación eliminada', NotificationType.SUCCESS);
    } catch (error) {
      console.error('Error al eliminar la notificación:', error);
      notify('Error al eliminar la notificación', NotificationType.ERROR);
    }
  };

  return (
    <div className='col-lg-12'>
      <div className='card h-100 p-0'>
        <div className='card-header border-bottom bg-base py-16 px-24 d-flex justify-content-between align-items-center'>
          <h6 className='text-lg fw-semibold mb-0'>
            Notificaciones
            {notifications.length > 0 && (
              <span className="badge bg-primary rounded-pill ms-2">{notifications.length}</span>
            )}
          </h6>
          <button 
            className="refresh-button"
            onClick={fetchNotifications}
            disabled={loading}
          >
            <Icon 
              icon="mdi:refresh" 
              className={`text-xl ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
        <div className='card-body p-24 d-flex flex-column gap-3'>
          {loading ? (
            <div className="text-center py-4">
              <Icon icon="mdi:loading" className="text-primary text-4xl animate-spin" />
              <p className="mt-2">Cargando notificaciones...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-4">
              <Icon icon="mdi:bell-off-outline" className="text-muted text-4xl mb-2" />
              <p className="text-muted">No hay notificaciones</p>
            </div>
          ) : (
            notifications.map(notification => (
              <Alert
                key={notification.id || Math.random()}
                type={notification.tipo}
                title={notification.titulo}
                description={notification.descripcion}
                fecha={notification.fecha}
                orden_id={notification.orden_id}
                usuario_id={notification.usuario_id}
                onDelete={() => handleDeleteNotification(notification.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsLayer;
