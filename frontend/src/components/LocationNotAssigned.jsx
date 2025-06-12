
import { Icon } from "@iconify/react";

const LocationNotAssigned = ({ userRole }) => {
  const getMessage = () => {
    switch (userRole?.toLowerCase()) {
      case 'cliente':
        return 'Para ver las estadísticas, necesitas tener una ubicación asignada. Contacta al administrador.';
      case 'proveedor':
        return 'Para acceder a las estadísticas de tu zona, solicita que te asignen una ubicación.';
      case 'admin':
        return 'Tu cuenta de administrador necesita una ubicación asignada para filtrar las estadísticas.';
      default:
        return 'Tu cuenta necesita una ubicación asignada para ver las estadísticas.';
    }
  };

  return (
    <div className="container-fluid py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <Icon 
                icon="mdi:map-marker-off" 
                className="text-warning mb-3" 
                style={{ fontSize: '4rem' }}
              />
              <h4 className="text-dark mb-3">Sin Ubicación Asignada</h4>
              <p className="text-muted mb-4">
                {getMessage()}
              </p>
              <div className="alert alert-info" role="alert">
                <Icon icon="mdi:information" className="me-2" />
                Las estadísticas se filtran por ubicación para mostrar datos relevantes a tu zona de trabajo.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationNotAssigned;
