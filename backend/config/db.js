require('dotenv').config();
const hana = require('@sap/hana-client');
const logger = require('../utils/logger');

const getHanaCredentials = () => {
  try {
    // Usar variables de entorno directas (desde GitHub Secrets)
    const serverNode = process.env.SERVER_NODE;
    const dbUsername = process.env.DB_USERNAME;
    const dbPassword = process.env.DB_PASSWORD;

    if (serverNode && dbUsername && dbPassword) {
      console.log('Using direct environment variables for HANA connection');
      return {
        serverNode,
        uid: dbUsername,
        pwd: dbPassword,
        encrypt: 'true',
        sslValidateCertificate: 'false'
      };
    }

    throw new Error('No HANA credentials found in environment variables');
  } catch (error) {
    console.error('Error retrieving HANA credentials:', error.message);
    throw error;
  }
};

const connection = hana.createConnection();

const connectDB = async () => {
  try {
    const connParams = getHanaCredentials();
    
    // Evitar registrar la contraseña en los logs
    console.log('Connecting to HANA with:', {
      serverNode: connParams.serverNode,
      uid: connParams.uid,
      // No mostramos pwd por seguridad
    });

    return new Promise((resolve, reject) => {
        // Try to simplify the connection errors if they occur
        connection.connect(connParams, (err) => {
            if (err) {
                // Clean up the error message for better terminal output
                let errorMsg = 'Database connection error';
                
                if (err.message) {
                    // Extract only the important parts of SAP HANA errors
                    if (err.message.includes('Connection failed')) {
                        errorMsg = 'HANA connection failed - check server availability';
                    } else if (err.message.includes('authentication failed')) {
                        errorMsg = 'HANA authentication failed - check credentials';
                    } else {
                        // Truncate long error messages
                        errorMsg = `HANA: ${err.message.substring(0, 100)}`;
                    }
                }
                
                logger.error(errorMsg);
                reject(err);
            } else {
                logger.info('Database connected successfully');
                resolve(connection);
            }
        });
    });
  } catch (error) {
    console.error('Failed to get HANA credentials:', error);
    throw error;
  }
};

// Manejo de cierre limpio
process.on('SIGTERM', () => {
  connection.disconnect();
  process.exit(0);
});

module.exports = { connection, connectDB };