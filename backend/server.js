require("dotenv").config();
const { connectDB } = require("./config/db"); // Updated import
const app = require("./app");
const logger = require('./utils/logger');
const { displayBanner } = require('./utils/banner');
const { initializeScheduler } = require('./services/stockUpdateScheduler');

// Set environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 5000;


app.listen(PORT, async () => {
  try {
    // Display startup banner
    displayBanner();
    
    // Connect to database
    await connectDB();
    logger.info(`Server running on http://localhost:${PORT}`);
    logger.info(`API documentation available at http://localhost:${PORT}/api-docs`);
    
    // Initialize the stock update scheduler silently
    initializeScheduler();
  } catch (error) {
    logger.error(`Database connection failed: ${error}`);
    process.exit(1);
  }
});
