import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import UserMenu from "../../general/userMenu";

const NavbarHeader = ({ sidebarActive, sidebarControl, mobileMenuControl }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://sapitos-backend.cfapps.us10-001.hana.ondemand.com";
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    const fetchUserSession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/getSession`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Sesión obtenida:", data);
          
          const formattedUserData = {
            id: data.usuario.id,
            NOMBRE: data.usuario.nombre,
            ROL: data.usuario.rol,
            CORREO: data.usuario.correo,
            USERNAME: data.usuario.username,
            ORGANIZACION: data.usuario.organizacion || '',
            LOCATION_ID: data.usuario.locationId || "",
            token: data.token
          };
          
          setUserData(formattedUserData);

          // Fetch location details if user has a location ID
          if (formattedUserData.LOCATION_ID) {
            const locationResponse = await fetch(`${API_BASE_URL}/location2/${formattedUserData.LOCATION_ID}`);
            if (locationResponse.ok) {
              const locationData = await locationResponse.json();
              setUserLocation(locationData);
            }
          }
        } else {
          console.log("No hay sesión válida");
          setUserData(null);
        }
      } catch (error) {
        console.error("Error obteniendo sesión:", error);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSession();
  }, []);

  // Construir la ruta de la imagen de perfil usando el correo del usuario
  let profileImage = "assets/images/user.png";
  if (userData?.CORREO) {
    profileImage = `${API_BASE_URL}/users/${encodeURIComponent(userData.CORREO)}/profileImage`;
  }

  // Mostrar loading mientras se obtiene la sesión
  if (loading) {
    return (
      <div className="navbar-header" id="navbarHeader">
        <div className="row align-items-center justify-content-between">
          <div className="col-auto">
            <div className="d-flex flex-wrap align-items-center gap-4">
              <button type="button" className="sidebar-toggle" onClick={sidebarControl}>
                <Icon
                  icon={sidebarActive ? "iconoir:arrow-right" : "heroicons:bars-3-solid"}
                  className="icon text-2xl non-active"
                />
              </button>
              <div className="d-flex align-items-center" style={{ height: "100%" }}>
                <span className="fs-4 fw-semibold text-dark">Cargando...</span>
              </div>
              <button onClick={mobileMenuControl} type="button" className="sidebar-mobile-toggle">
                <Icon icon="heroicons:bars-3-solid" className="icon" />
              </button>
            </div>
          </div>
          <div>
            <span>Cargando usuario...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="navbar-header" id="navbarHeader">
      <div className="row align-items-center justify-content-between">
        <div className="col-auto">
          <div className="d-flex flex-wrap align-items-center gap-4">
            <button type="button" className="sidebar-toggle" onClick={sidebarControl}>
              <Icon
                icon={sidebarActive ? "iconoir:arrow-right" : "heroicons:bars-3-solid"}
                className="icon text-2xl non-active"
              />
            </button>

            {/* Location and Organization Info */}
            <div className="d-flex align-items-center gap-2" style={{ height: "100%" }}>
              {userLocation && (
                <>
                  <Icon icon="mdi:map-marker" className="text-primary fs-4" />
                  <span className="text-primary fw-semibold">{userLocation.nombre}</span>
                  <span className="text-secondary-light fs-6">({userLocation.organizacion || ""})</span>
                </>
              )}
            </div>

            <button onClick={mobileMenuControl} type="button" className="sidebar-mobile-toggle">
              <Icon icon="heroicons:bars-3-solid" className="icon" />
            </button>
          </div>
        </div>

        <UserMenu
          name={userData?.NOMBRE || "Usuario"}
          role={userData?.ROL || "Rol"}
          profileImage={profileImage}
          onClose={() => console.log("Cerrar menú")}
        />
      </div>
    </div>
  );
};

export default NavbarHeader;