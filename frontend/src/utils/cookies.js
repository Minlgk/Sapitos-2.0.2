import { COOKIE_CONFIG } from '../config';

// Función para obtener una cookie
export const getCookie = (name) => {
  try {
    // Primero intentar obtener la cookie del navegador
    const cookies = document.cookie.split(';');
    const cookie = cookies.find(c => c.trim().startsWith(`${name}=`));
    
    if (cookie) {
      console.log(`Cookie ${name} encontrada en el navegador`);
      let value = cookie.split('=')[1];
      try {
        // Si es un JSON, parsearlo
        return JSON.parse(decodeURIComponent(value));
      } catch (e) {
        // Si no es un JSON, devolverlo como está
        return decodeURIComponent(value);
      }
    }
    
    console.log(`Cookie ${name} not found, trying localStorage`);
    
    // Si no encuentra la cookie, buscar en localStorage como respaldo
    const localData = localStorage.getItem(name === 'UserData' ? 'userData' : name);
    if (localData) {
      console.log(`Data found in localStorage for ${name}`);
      try {
        return JSON.parse(localData);
      } catch (e) {
        return localData;
      }
    }
    
    console.log(`No data found for ${name} in cookies or localStorage`);
    return null;
  } catch (error) {
    console.error(`Error getting cookie ${name}:`, error);
    return null;
  }
};

// Función para establecer una cookie
export const setCookie = (name, value, options = {}) => {
  try {
    // Combinar opciones por defecto con las opciones proporcionadas
    const cookieOptions = { ...COOKIE_CONFIG, ...options };
    
    // Convertir el valor a string si es un objeto
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
    
    // Construir la cookie
    let cookie = `${name}=${encodeURIComponent(stringValue)}`;
    
    // Añadir opciones de la cookie
    if (cookieOptions.path) cookie += `; path=${cookieOptions.path}`;
    if (cookieOptions.domain) cookie += `; domain=${cookieOptions.domain}`;
    if (cookieOptions.maxAge) cookie += `; max-age=${cookieOptions.maxAge}`;
    if (cookieOptions.expires) cookie += `; expires=${cookieOptions.expires}`;
    if (cookieOptions.secure) cookie += '; secure';
    if (cookieOptions.sameSite) cookie += `; samesite=${cookieOptions.sameSite}`;
    
    // Establecer la cookie
    document.cookie = cookie;
    console.log(`Cookie ${name} set with options:`, cookieOptions);
    
    // Almacenar también en localStorage como respaldo
    try {
      localStorage.setItem(name === 'UserData' ? 'userData' : name, stringValue);
      console.log(`Data also stored in localStorage for ${name}`);
    } catch (e) {
      console.warn(`Couldn't store data in localStorage for ${name}:`, e);
    }
    
    return true;
  } catch (error) {
    console.error(`Error setting cookie ${name}:`, error);
    
    // Intentar almacenar solo en localStorage como último recurso
    try {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
      localStorage.setItem(name === 'UserData' ? 'userData' : name, stringValue);
      console.log(`Data stored only in localStorage for ${name} (cookie failed)`);
      return true;
    } catch (e) {
      console.error(`Complete failure storing data for ${name}:`, e);
      return false;
    }
  }
};

// Función para eliminar una cookie
export const removeCookie = (name) => {
  try {
    // Eliminar la cookie estableciendo una fecha de expiración en el pasado
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure`;
    console.log(`Cookie ${name} removed`);
    
    // Eliminar también de localStorage
    localStorage.removeItem(name === 'UserData' ? 'userData' : name);
    console.log(`Data also removed from localStorage for ${name}`);
    
    return true;
  } catch (error) {
    console.error(`Error removing cookie ${name}:`, error);
    return false;
  }
};

// Exportación por defecto para mantener compatibilidad con código existente
export default { getCookie, setCookie, removeCookie };