const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop().split(';').shift();
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
};

export default getCookie;