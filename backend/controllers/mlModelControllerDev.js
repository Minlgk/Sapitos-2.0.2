/**
 * Development Controller for ML model operations
 * 
 * Provides mock endpoints for development when the actual ML system is not available.
 */

const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

/**
 * Run a mock model update
 */
const runModelUpdate = async (req, res) => {
    try {
        logger.info('Mock model update requested');
        
        // Check if user has required permissions
        if (req.user && req.user.rol !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'No tienes permisos para ejecutar esta acción' 
            });
        }
        
        // Simulate a running pipeline
        setTimeout(() => {
            logger.info('Mock pipeline completed!');
        }, 5000);
        
        return res.status(200).json({ 
            success: true, 
            message: 'Actualización de modelo iniciada correctamente (modo desarrollo). Revisa los logs para más detalles.' 
        });
    } catch (error) {
        logger.error(`Error in mock model update: ${error}`);
        return res.status(500).json({ 
            success: false, 
            message: 'Error al iniciar la actualización del modelo',
            error: error.message 
        });
    }
};

/**
 * Get mock logs
 */
const getModelUpdateLogs = async (req, res) => {
    try {
        // Check if user has required permissions
        if (req.user && req.user.rol !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'No tienes permisos para ver los logs' 
            });
        }
        
        // For development, create a mock log response
        return res.status(200).json({
            success: true,
            logFile: 'weekly_stock_update_dev_2023-10-25.log',
            logContent: `
[2023-10-25 08:00:01] INFO: Iniciando actualización de stock mínimo
[2023-10-25 08:00:05] INFO: Conectando a la base de datos SAP HANA
[2023-10-25 08:00:12] INFO: Extrayendo datos históricos de ventas
[2023-10-25 08:01:35] INFO: Procesamiento de datos completado
[2023-10-25 08:02:45] INFO: Entrenamiento del modelo iniciado
[2023-10-25 08:15:20] INFO: Entrenamiento completado - RMSE: 12.5, MAE: 8.2
[2023-10-25 08:16:10] INFO: Generando predicciones para los próximos 60 días
[2023-10-25 08:18:45] INFO: Calculando stocks mínimos óptimos
[2023-10-25 08:20:15] INFO: Actualizando base de datos con nuevos valores
[2023-10-25 08:22:30] INFO: Proceso completado correctamente
            `.trim()
        });
    } catch (error) {
        logger.error(`Error retrieving mock model logs: ${error}`);
        return res.status(500).json({
            success: false,
            message: 'Error al recuperar los logs de actualización',
            error: error.message
        });
    }
};

/**
 * Get mock schedule information
 */
const getNextScheduledUpdate = async (req, res) => {
    try {
        // For development, create a mock schedule response
        const now = new Date();
        const nextRun = new Date(now);
        
        // Set next run to next Monday at 1:00 AM
        nextRun.setDate(now.getDate() + ((1 - now.getDay() + 7) % 7));
        nextRun.setHours(1, 0, 0, 0);
        
        return res.status(200).json({
            success: true,
            schedule: {
                day: 'Lunes',
                hour: '1:00',
                nextRun: nextRun.toISOString()
            }
        });
    } catch (error) {
        logger.error(`Error retrieving mock schedule information: ${error}`);
        return res.status(500).json({
            success: false,
            message: 'Error al recuperar información sobre la programación',
            error: error.message
        });
    }
};

/**
 * Get model status
 */
const getModelStatus = async (req, res) => {
    try {
        // For testing purposes, return a random status
        // In production, this would check the actual model status
        const statusOptions = ['active', 'inactive'];
        const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
        
        return res.status(200).json({
            success: true,
            status: status,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error retrieving model status: ${error}`);
        return res.status(500).json({
            success: false,
            message: 'Error al recuperar el estado del modelo',
            error: error.message
        });
    }
};

/**
 * Toggle model status (active/inactive)
 */
const toggleModelStatus = async (req, res) => {
    try {
        // Check if user has required permissions
        if (req.user && req.user.rol !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'No tienes permisos para cambiar el estado del modelo' 
            });
        }
        
        const { status } = req.body;
        
        if (!status || (status !== 'active' && status !== 'inactive')) {
            return res.status(400).json({
                success: false,
                message: 'Estado de modelo inválido. Use "active" o "inactive".'
            });
        }
        
        // For development, just return success with the new status
        return res.status(200).json({
            success: true,
            message: `Modelo ${status === 'active' ? 'activado' : 'desactivado'} correctamente.`,
            status: status,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error toggling model status: ${error}`);
        return res.status(500).json({
            success: false,
            message: 'Error al cambiar el estado del modelo',
            error: error.message
        });
    }
};

/**
 * Get mock historical performance metrics
 */
const getModelMetrics = async (req, res) => {
    try {
        // Generate mock metrics for past 7 days
        const metrics = Array.from({ length: 7 }).map((_, idx) => {
            const date = new Date(Date.now() - idx * 24 * 60 * 60 * 1000);
            return { date: date.toISOString(), mape: parseFloat((Math.random() * 10 + 5).toFixed(2)) };
        }).reverse();
        return res.status(200).json({ success: true, metrics });
    } catch (error) {
        logger.error(`Error retrieving mock metrics: ${error}`);
        return res.status(500).json({ success: false, message: 'Error al recuperar métricas (dev)', error: error.message });
    }
};

module.exports = {
    runModelUpdate,
    getModelUpdateLogs,
    getNextScheduledUpdate,
    getModelStatus,
    toggleModelStatus,
    getModelMetrics
};
