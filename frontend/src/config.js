// Configuration for API URLs
export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 
  (typeof window !== 'undefined' && window.API_BASE_URL) || 
  "https://sapitos-backend.cfapps.us10-001.hana.ondemand.com";

export default {
  API_BASE_URL
}; 