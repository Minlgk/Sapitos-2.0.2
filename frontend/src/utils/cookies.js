const getCookie = (name) => {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    
    if (parts.length === 2) {
      const cookieValue = parts.pop().split(';').shift();
      
      // Si la cookie está vacía, retornar null
      if (!cookieValue) return null;
      
      try {
        // Intentar parsear el valor como JSON
        const parsedValue = JSON.parse(cookieValue);
        
        // Asegurar que location_id esté disponible en ambos formatos
        if (parsedValue && (parsedValue.LOCATION_ID || parsedValue.locationId)) {
          parsedValue.LOCATION_ID = parsedValue.LOCATION_ID || parsedValue.locationId;
          parsedValue.locationId = parsedValue.LOCATION_ID || parsedValue.locationId;
        }
        
        return parsedValue;
      } catch (e) {
        // Si no es JSON, devolver el valor tal cual
        return cookieValue;
      }
    }
    return null;
  } catch (error) {
    console.error("Error al obtener cookie:", error);
    return null;
  }
};

// Función para establecer cookies con configuración para Cloud Foundry
const setCookie = (name, value, options = {}) => {
  try {
    // Opciones predeterminadas optimizadas para Cloud Foundry
    const defaultOptions = {
      path: "/",
      secure: true,
      sameSite: "None"
    };
    
    // Combinar opciones
    const cookieOptions = { ...defaultOptions, ...options };
    
    // Convertir el valor a string si es un objeto
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
    
    // Construir la string de la cookie
    let cookieString = `${name}=${stringValue}`;
    
    // Añadir opciones
    if (cookieOptions.path) cookieString += `; path=${cookieOptions.path}`;
    if (cookieOptions.domain) cookieString += `; domain=${cookieOptions.domain}`;
    if (cookieOptions.maxAge) cookieString += `; max-age=${cookieOptions.maxAge}`;
    if (cookieOptions.expires) cookieString += `; expires=${cookieOptions.expires.toUTCString()}`;
    if (cookieOptions.secure) cookieString += '; secure';
    if (cookieOptions.sameSite) cookieString += `; samesite=${cookieOptions.sameSite}`;
    if (cookieOptions.httpOnly) cookieString += '; httponly';
    
    // Establecer la cookie
    document.cookie = cookieString;
    return true;
  } catch (error) {
    console.error("Error al establecer cookie:", error);
    return false;
  }
};

// Función para eliminar una cookie
const removeCookie = (name) => {
  try {
    // Para eliminar una cookie, establecemos una fecha de expiración en el pasado
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=None`;
    return true;
  } catch (error) {
    console.error("Error al eliminar cookie:", error);
    return false;
  }
};

export { getCookie, setCookie, removeCookie };
export default getCookie;