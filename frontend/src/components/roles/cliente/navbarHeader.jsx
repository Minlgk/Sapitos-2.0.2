import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import UserMenu from "../../general/userMenu";
import { getCookie } from "../../../utils/cookies";

const NavbarHeader = ({ sidebarActive, sidebarControl, mobileMenuControl }) => {
  const [userData, setUserData] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://sapitos-backend.cfapps.us10-001.hana.ondemand.com";
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  const fetchUserData = async () => {
    try {
      // Primero intentamos obtener los datos de la cookie
      const cookieData = getCookie("UserData");
      console.log("Cookie data:", cookieData);
      
      if (cookieData) {
        // Si cookieData es un string, intentar parsearlo
        const parsedData = typeof cookieData === 'string' ? JSON.parse(cookieData) : cookieData;
        console.log("Parsed user data from cookie:", parsedData);
        setUserData(parsedData);

        // Fetch location details if user has a location ID
        if (parsedData.LOCATION_ID) {
          await fetchLocationData(parsedData.LOCATION_ID);
        } else {
          console.log("No LOCATION_ID found in user data");
          setLoading(false);
        }
      } else {
        console.log("No UserData cookie found, fetching from server");
        // Si no hay cookie, intentamos obtener la sesión del servidor
        await fetchSessionFromServer();
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setLoading(false);
    }
  };

  const fetchSessionFromServer = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/getSession`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Session data from server:", data);
        
        if (data.usuario) {
          setUserData(data.usuario);
          
          // Fetch location if available
          if (data.usuario.LOCATION_ID || data.usuario.locationId) {
            const locationId = data.usuario.LOCATION_ID || data.usuario.locationId;
            await fetchLocationData(locationId);
          } else {
            setLoading(false);
          }
        } else {
          console.log("No user data in session response");
          setLoading(false);
        }
      } else {
        console.log("Failed to fetch session:", response.status);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching session:", error);
      setLoading(false);
    }
  };

  const fetchLocationData = async (locationId) => {
    try {
      console.log("Fetching location for ID:", locationId);
      const locationResponse = await fetch(`${API_BASE_URL}/helpers/locations/${locationId}`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log("Location response status:", locationResponse.status);
      
      if (locationResponse.ok) {
        const locationData = await locationResponse.json();
        console.log("Location data received:", locationData);
        setUserLocation(locationData);
      } else {
        const errorText = await locationResponse.text();
        console.error("Error fetching location:", errorText);
      }
    } catch (error) {
      console.error("Error fetching location data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

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

  let profileImage = "assets/images/user.png";
  if (userData?.CORREO) {
    profileImage = `${API_BASE_URL}/users/${encodeURIComponent(userData.CORREO)}/profileImage`;
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
