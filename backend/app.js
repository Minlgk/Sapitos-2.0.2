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

// Create a more permissive CORS configuration for debugging purposes
// WARNING: This is only for testing and development!
const corsOptions = {
  origin: true, // Allow all origins - for testing only
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept', 'Cache-Control', 'Pragma', 'Expires'],
  preflightContinue: false,
  maxAge: 86400, // Preflight results cached for 24 hours
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle OPTIONS preflight requests separately to ensure they respond properly
app.options('*', cors(corsOptions));

// Add headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept, Cache-Control, Pragma, Expires');
  next();
});

app.use(cookieParser()); 

// Make sure Express properly parses JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// OTP routes
app.use("/api/otp", otpRoutes); 
const settingsRoutes = require("./routes/settings");
app.use("/api/settings", settingsRoutes);

// login, register, and logout routes
app.use("/users", userRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
app.use("/users/getUsers", userRoutes); 
app.use("/users/logoutUser", userRoutes);
app.use("/users/logoutUser", userRoutes);

// ML model routes
app.use("/ml", mlRoutes);

// inventory routes
app.use("/inventory", inventoryRoutes);

// roles routes
app.use("/rol", rolRoutes);

// locations routes
app.use("/location2", locationRoutes); 

// alertas routes
app.use("/alertas", alertasRoutes);

// articulo routes
app.use("/articulo", articuloRoutes);

// pedidos routes
app.use("/pedido", pedidoRoutes);
app.use("/proveedores", pedidoRoutes);
app.use("/pedidosH", pedidosHRoutes);
app.use("/proveedor", pedidosProveedorRoutes);
app.use("/proveedores", pedidoRoutes);
app.use("/pedidosH", pedidosHRoutes);
app.use("/proveedor", pedidosProveedorRoutes);
app.use('/admin', adminRoutes);

// rutas para el asistente de IA 
app.use("/api/ai", aiRoutes);

app.use("/helpers", pedidosHelperRoutes);
app.use("/kpi", kpiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

module.exports = app;