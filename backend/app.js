try {
  require("dotenv").config();
} catch (error) {
  console.log("dotenv not available, using environment variables directly");
  // This is fine in production where environment variables are set directly
}

const express = require("express");
const cors = require("cors");
const cookieParser = require('cookie-parser');  
const { swaggerUi, specs } = require("./docs/swagger");
const { connection } = require("./config/db");

const userRoutes = require("./routes/users");
const inventoryRoutes = require("./routes/inventory");
const pedidoRoutes = require("./routes/pedido");
const pedidosHRoutes = require("./routes/pedidosH.js");
const pedidosProveedorRoutes = require("./routes/pedidosProveedor.js");
const rolRoutes = require("./routes/rol.js");
const locationRoutes = require("./routes/location");
const mlRoutes = require("./routes/ml");
const articuloRoutes = require("./routes/articulo");
const otpRoutes = require("./routes/otp"); // Added OTP routes
const alertasRoutes = require("./routes/alertas"); // Added Alertas routes
const aiRoutes = require("./Ai_OpenAI/aiRoutes");
const pedidosHelperRoutes = require("./routes/pedidosH");
const kpiRoutes = require("./routes/kpi.js");
const adminRoutes = require('./routes/admin');

const app = express();

// Log the frontend URL from environment variables
console.log("FRONTEND_URL from env:", process.env.FRONTEND_URL);

// Detectar si estamos en Cloud Foundry
const isCloudFoundry = process.env.VCAP_APPLICATION ? true : false;
console.log("Running in Cloud Foundry:", isCloudFoundry);

// Obtener la URL del frontend desde las variables de entorno
let allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
if (allowedOrigin.endsWith('/')) {
  allowedOrigin = allowedOrigin.slice(0, -1);
}

// Configurar múltiples orígenes permitidos para mayor flexibilidad
const allowedOrigins = [
  allowedOrigin,
  'https://sapitos-frontend.cfapps.us10-001.hana.ondemand.com',
  'https://sapitos-frontend.cfapps.us10.hana.ondemand.com',
  'http://localhost:5173',
  'http://localhost:3000'
];

console.log("Allowed origins for CORS:", allowedOrigins);

// Configuración CORS optimizada para Cloud Foundry
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir solicitudes sin origen (como aplicaciones móviles o curl)
    if (!origin) {
      return callback(null, true);
    }
    
    // Verificar si el origen está en la lista de permitidos
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`Origin ${origin} not allowed by CORS policy`);
      // Permitir de todos modos en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log("Allowing anyway because we're in development mode");
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept', 'Cache-Control', 'Pragma', 'Expires'],
  preflightContinue: false,
  maxAge: 86400, // Preflight results cached for 24 hours
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle OPTIONS preflight requests
app.options('*', cors(corsOptions));

// Add headers to all responses for compatibility
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
    res.header('Access-Control-Allow-Origin', origin || allowedOrigins[0]);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept, Cache-Control, Pragma, Expires');
  
  // Configurar SameSite=None para cookies en Cloud Foundry
  if (isCloudFoundry) {
    res.header('Set-Cookie', 'SameSite=None; Secure');
  }
  
  next();
});

// Usar cookie-parser con configuración segura
app.use(cookieParser());

// Make sure Express properly parses JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar rutas para documentación Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// login, register, and logout routes
app.use("/users", userRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/pedido", pedidoRoutes);
app.use("/pedidosH", pedidosHRoutes);
app.use("/pedidosProveedor", pedidosProveedorRoutes);
app.use("/rol", rolRoutes);
app.use("/location2", locationRoutes);
app.use("/ml", mlRoutes);
app.use("/articulo", articuloRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/alertas", alertasRoutes);
app.use("/api/ai", aiRoutes);
app.use("/helpers", pedidosHelperRoutes);
app.use("/kpi", kpiRoutes);
app.use("/admin", adminRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", timestamp: new Date().toISOString() });
});

// Root endpoint for API information
app.get("/", (req, res) => {
  res.json({
    message: "Sapitos API",
    version: "2.0.2",
    documentation: "/api-docs",
    status: "running",
    environment: process.env.NODE_ENV || "development"
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

module.exports = app;