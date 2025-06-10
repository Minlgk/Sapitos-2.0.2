import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from "@iconify/react/dist/iconify.js";

const NotFoundPage = () => {
  return (
    <div className="container py-5 text-center">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card p-5 shadow">
            <Icon icon="mdi:alert-circle-outline" className="text-danger display-1 mb-4" />
            <h1 className="h3 mb-3">Página no encontrada</h1>
            <p className="text-muted mb-4">
              Lo sentimos, la página que estás buscando no existe o ha sido movida.
            </p>
            <div className="d-flex justify-content-center gap-3">
              <Link to="/dashboard" className="btn btn-primary">
                <Icon icon="mdi:home" className="me-2" />
                Ir al Dashboard
              </Link>
              <button 
                className="btn btn-outline-secondary"
                onClick={() => window.history.back()}
              >
                <Icon icon="mdi:arrow-left" className="me-2" />
                Regresar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 