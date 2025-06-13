// Detectar si estamos en Cloud Foundry
const isCloudFoundry = window.location.hostname.includes('cfapps.us10-001.hana.ondemand.com');

// Configurar la URL del backend según el entorno
let apiBaseUrl = import.meta.env.VITE_BACKEND_URL;

// Si no hay URL configurada o estamos en Cloud Foundry, usar la URL por defecto
if (!apiBaseUrl || isCloudFoundry) {
  apiBaseUrl = 'https://sapitos-backend.cfapps.us10-001.hana.ondemand.com';
}

// Asegurarse de que la URL no termine con una barra
if (apiBaseUrl.endsWith('/')) {
  apiBaseUrl = apiBaseUrl.slice(0, -1);
}

console.log(`Frontend config - API_BASE_URL: ${apiBaseUrl}`);
console.log(`Frontend config - Is Cloud Foundry: ${isCloudFoundry}`);

// Configuración de cookies para Cloud Foundry
const cookieConfig = {
  path: '/',
  secure: true,
  sameSite: 'None' // Siempre usar None para permitir cookies cross-origin
};

// No usar domain en cookies para evitar problemas con subdominios
// Solo configurar domain si es absolutamente necesario
// if (isCloudFoundry) {
//   cookieConfig.domain = 'cfapps.us10-001.hana.ondemand.com';
// }

console.log(`Frontend config - Cookie config: ${JSON.stringify(cookieConfig)}`);

export const API_BASE_URL = apiBaseUrl;
export const COOKIE_CONFIG = cookieConfig;
export const IS_CLOUD_FOUNDRY = isCloudFoundry;

// Configuración por defecto para todas las solicitudes fetch
export const fetchConfig = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

export default {
  API_BASE_URL,
  COOKIE_CONFIG,
  IS_CLOUD_FOUNDRY,
  fetchConfig
}; 