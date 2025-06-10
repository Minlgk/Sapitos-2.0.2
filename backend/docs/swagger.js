const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const PORT = process.env.BACK_PORT || 5000;

const isCloudFoundry = process.env.VCAP_APPLICATION ? true : false;

let API_BASE_URL;
if (isCloudFoundry) {
  API_BASE_URL = process.env.BACKEND_URL || "https://sapitos-backend.cfapps.io";
} else {
  API_BASE_URL = `http://localhost:${PORT}`;
}

if (API_BASE_URL.endsWith('/')) {
  API_BASE_URL = API_BASE_URL.slice(0, -1);
}

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Sapitos API",
      version: "1.0.0",
      description: "API para el sistema Sapitos",
    },
    servers: [
      {
        url: API_BASE_URL,
        description: isCloudFoundry ? "Servidor de producción" : "Servidor local",
      },
      {
        url: "https://sapitos-backend.cfapps.io",
        description: "Servidor de producción (explícito)",
      },
      {
        url: `http://localhost:${PORT}`,
        description: "Servidor de desarrollo local",
      },
    ],
  },
  apis: ["./routes/*.js"], 
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };