import SalesStatisticOne from "./general/child/SalesStatisticOne";
// import TotalSubscriberOne from "./general/child/TotalSubscriberOne";
import UnitCountOne from "./general/child/UnitCountOne";
import RiskProductsOne from "./general/child/RiskProductsOne";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import getCookie from "../utils/cookies";
import LocationNotAssigned from "./LocationNotAssigned";

const DashBoardLayerOne = () => {
  const [userData, setUserData] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [allLocations, setAllLocations] = useState([]);
  const [kpiData, setKpiData] = useState({
    ventas: { total: 0, percentage_change: 0 },
    unidades: { total: 0, percentage_change: 0 },
    articulos: { total: 0, percentage_change: 0 },
    clientes: { total: 0, percentage_change: 0 },
  });
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://sapitos-backend.cfapps.us10-001.hana.ondemand.com";

  useEffect(() => {
    const fetchKpiData = async (locationId) => {
      try {
        // Get user data to extract location ID
        const cookieData = getCookie("UserData");
        let locationParam = '';
        
        if (locationId) {
          locationParam = `?locationId=${locationId}`;
        } else if (cookieData) {
          const parsedData = typeof cookieData === 'string' ? JSON.parse(cookieData) : cookieData;
          const userLocationId = parsedData?.LOCATION_ID || parsedData?.locationId;
          if (userLocationId) {
            locationParam = `?locationId=${userLocationId}`;
          }
        }

        const [
          ventasRes,
          unidadesRes,
          articulosRes,
          clientesRes,
        ] = await Promise.all([
          fetch(`${API_BASE_URL}/kpi/ventas${locationParam}`),
          fetch(`${API_BASE_URL}/kpi/unidades${locationParam}`),
          fetch(`${API_BASE_URL}/kpi/articulos${locationParam}`),
          fetch(`${API_BASE_URL}/kpi/clientes${locationParam}`),
        ]);

      const ventas = await ventasRes.json();
      const unidades = await unidadesRes.json();
      const articulos = await articulosRes.json();
      const clientes = await clientesRes.json();

        setKpiData({
          ventas,
          unidades,
          articulos,
          clientes,
        });
      } catch (error) {
        console.error("Error fetching KPI data:", error);
      }
    };

    // Only fetch KPI data if we have user data
    if (userData) {
      const userLocationId = userData?.LOCATION_ID || userData?.locationId;
      fetchKpiData(isAdmin ? "all" : userLocationId);
    }
  }, [userData, isAdmin, selectedLocationId]);

  // Fetch all locations
  useEffect(() => {
    const fetchAllLocations = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/location2`, {
          credentials: "include"
        });
        
        if (response.ok) {
          const locationsData = await response.json();
          setAllLocations(locationsData);
        } else {
          console.error("Error fetching locations:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching all locations:", error);
      }
    };
    
    fetchAllLocations();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const cookieData = getCookie("UserData");
        console.log("Cookie data:", cookieData);
        
        if (cookieData) {
          // Si cookieData es un string, intentar parsearlo
          const parsedData = typeof cookieData === 'string' ? JSON.parse(cookieData) : cookieData;
          console.log("Parsed user data:", parsedData);
          setUserData(parsedData);
          
          // Check if user is admin
          setIsAdmin(parsedData.ROL === 'ADMIN');

          // Verificar que el usuario tenga un LOCATION_ID válido
          const locationId = parsedData.LOCATION_ID || parsedData.locationId;
          setSelectedLocationId(locationId);
          console.log("Location ID encontrado:", locationId);

          // Fetch location details if user has a location ID
          if (locationId) {
            console.log("Fetching location for ID:", locationId);
            const locationResponse = await fetch(`${API_BASE_URL}/helpers/locations/${locationId}`, {
              credentials: 'include'
            });
            console.log("Location response status:", locationResponse.status);
            
            if (locationResponse.ok) {
              const locationData = await locationResponse.json();
              console.log("Location data received:", locationData);
              setUserLocation(locationData);

              // Fetch inventory data for the location
              const inventoryResponse = await fetch(`${API_BASE_URL}/inventory/location/${locationId}`, {
                credentials: 'include'
              });
              console.log("Inventory response status:", inventoryResponse.status);

              if (inventoryResponse.ok) {
                const inventoryData = await inventoryResponse.json();
                console.log("Inventory data received:", inventoryData);
                setInventoryData(inventoryData);
              } else {
                const errorText = await inventoryResponse.text();
                console.error("Error fetching inventory:", errorText);
                setLocationError("No se pudo cargar la información de inventario");
              }

              // Fetch KPI data for the user's location
              fetchKpiData(userLocationId);
            } else {
              const errorText = await locationResponse.text();
              console.error("Error fetching location:", errorText);
              setLocationError("No se encontró información de ubicación");
            }
          } else {
            console.log("No LOCATION_ID found in user data");
            setLocationError("Usuario sin ubicación asignada");
          }
        } else {
          console.log("No UserData cookie found");
          setLocationError("No se encontraron datos de usuario");
        }
      } catch (error) {
        console.error("Error obteniendo datos del usuario:", error);
        setUserData(null);
        setLocationError("Error al cargar información de usuario");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Si el usuario no tiene ubicación asignada, mostrar el componente especial
  if (!loading && locationError === "Usuario sin ubicación asignada") {
    return <LocationNotAssigned userRole={userData?.ROL} />;
  }  return (
    <>
      {/* UnitCountOne */}
      <div className="mt-4">
        <UnitCountOne kpiData={kpiData} />
      </div>

      <section className='row gy-4 mt-1'>
        {/* SalesStatisticOne */}
        <SalesStatisticOne locationId={selectedLocationId ? String(selectedLocationId) : ''} />

        {/* RiskProductsOne */}
        <RiskProductsOne inventoryData={inventoryData} loading={loading} error={!inventoryData && !loading ? "No se pudo cargar la información de inventario." : null} />

      </section>

      {/* Location Not Assigned Component */}
      {!loading && !userLocation && <LocationNotAssigned />}
    </>
  );
};

export default DashBoardLayerOne;
