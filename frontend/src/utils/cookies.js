import { COOKIE_CONFIG, IS_CLOUD_FOUNDRY } from '../config';

const getCookie = (name) => {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    
    if (parts.length === 2) {
      const cookieValue = parts.pop().split(';').shift();
      
      // Si la cookie está vacía, intentar obtener del localStorage
      if (!cookieValue) {
        console.log(`Cookie ${name} not found, trying localStorage`);
        if (name === 'UserData') {
          const localData = localStorage.getItem('userData');
          if (localData) {
            try {
              return JSON.parse(localData);
            } catch (e) {
              console.error("Error parsing userData from localStorage:", e);
            }
          }
        }
        return null;
      }
      
      try {
        // Intentar parsear el valor como JSON
        const parsedValue = JSON.parse(cookieValue);
        
        // Asegurar que location_id esté disponible en ambos formatos
        if (parsedValue && (parsedValue.LOCATION_ID || parsedValue.locationId)) {
          parsedValue.LOCATION_ID = parsedValue.LOCATION_ID || parsedValue.locationId;
          parsedValue.locationId = parsedValue.LOCATION_ID || parsedValue.locationId;
        }
        
        // También guardar en localStorage como respaldo
        if (name === 'UserData') {
          localStorage.setItem('userData', JSON.stringify(parsedValue));
        }
        
        return parsedValue;
      } catch (e) {
        // Si no es JSON, devolver el valor tal cual
        if (name === 'Auth') {
          localStorage.setItem('authToken', cookieValue);
        }
        return cookieValue;
      }
    }
    
    // Si no se encuentra la cookie, intentar obtener del localStorage
    console.log(`Cookie ${name} not found, trying localStorage`);
    if (name === 'UserData') {
      const localData = localStorage.getItem('userData');
      if (localData) {
        try {
          return JSON.parse(localData);
        } catch (e) {
          console.error("Error parsing userData from localStorage:", e);
        }
      }
    } else if (name === 'Auth') {
      return localStorage.getItem('authToken');
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
    // Combinar opciones con la configuración global
    const cookieOptions = { ...COOKIE_CONFIG, ...options };
    
    // No usar domain para evitar problemas
    delete cookieOptions.domain;
    
    // Convertir el valor a string si es un objeto
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
    
    // Construir la string de la cookie
    let cookieString = `${name}=${stringValue}`;
    
    // Añadir opciones
    if (cookieOptions.path) cookieString += `; path=${cookieOptions.path}`;
    if (cookieOptions.maxAge) cookieString += `; max-age=${cookieOptions.maxAge}`;
    if (cookieOptions.expires) cookieString += `; expires=${cookieOptions.expires.toUTCString()}`;
    if (cookieOptions.secure) cookieString += '; secure';
    if (cookieOptions.sameSite) cookieString += `; samesite=${cookieOptions.sameSite}`;
    if (cookieOptions.httpOnly) cookieString += '; httponly';
    
    console.log(`Setting cookie: ${name} with options:`, cookieOptions);
    
    // Establecer la cookie
    document.cookie = cookieString;
    
    // También guardar en localStorage como respaldo
    if (name === 'UserData') {
      localStorage.setItem('userData', stringValue);
    } else if (name === 'Auth') {
      localStorage.setItem('authToken', stringValue);
    }
    
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
    let cookieString = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure`;
    
    // Añadir configuración específica para Cloud Foundry
    if (IS_CLOUD_FOUNDRY) {
      cookieString += `; samesite=None`;
    }
    
    console.log(`Removing cookie: ${name}`);
    document.cookie = cookieString;
    
    // También eliminar del localStorage
    if (name === 'UserData') {
      localStorage.removeItem('userData');
    } else if (name === 'Auth') {
      localStorage.removeItem('authToken');
    }
    
    return true;
  } catch (error) {
    console.error("Error al eliminar cookie:", error);
    return false;
  }
};

export { getCookie, setCookie, removeCookie };
export default getCookie;