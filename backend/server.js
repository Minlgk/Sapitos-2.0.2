try {
  require("dotenv").config();
} catch (error) {
  console.log("dotenv not available, using environment variables directly");
  // This is fine in production where environment variables are set directly
}

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
    logger.info(`Server running on port ${PORT}`);
    logger.info(`API documentation available at /api-docs`);
    
    // Initialize the stock update scheduler silently
    initializeScheduler();
  } catch (error) {
    logger.error(`Database connection failed: ${error}`);
    process.exit(1);
  }
});
