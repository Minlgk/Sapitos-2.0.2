const express = require("express");
const { 
  getMetodosPago,
  getRoles,
  getLocations,
  getLocationsPorTipo,
  getLocationById,
  insertLocation,
  updateLocation,
  deleteLocation,
  getEstadisticasLocations,
  getTiposLocation,
  getLocationsCercanas
} = require('../controllers/pediosHelper');

const router = express.Router();
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * /helpers/metodos-pago:
 *   get:
 *     summary: Obtener todos los métodos de pago disponibles
 *     tags: [Helpers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de métodos de pago
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *       500:
 *         description: Error del servidor
 */
router.get("/metodos-pago", auth(), getMetodosPago);

/**
 * @swagger
 * /helpers/roles:
 *   get:
 *     summary: Obtener todos los roles disponibles
 *     tags: [Helpers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *       500:
 *         description: Error del servidor
 */
router.get("/roles", auth(), getRoles);

/**
 * @swagger
 * /helpers/locations:
 *   get:
 *     summary: Obtener todas las locations
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de locations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   tipo:
 *                     type: string
 *                   posicionX:
 *                     type: number
 *                   posicionY:
 *                     type: number
 *                   fechaCreado:
 *                     type: string
 *                     format: date
 *                   organizacion:
 *                     type: string
 *                   totalUsuarios:
 *                     type: integer
 *                   totalProductos:
 *                     type: integer
 *       500:
 *         description: Error del servidor
 *   post:
 *     summary: Crear nueva location
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - tipo
 *             properties:
 *               nombre:
 *                 type: string
 *                 maxLength: 100
 *               tipo:
 *                 type: string
 *                 maxLength: 50
 *               posicionX:
 *                 type: number
 *               posicionY:
 *                 type: number
 *               organizacion:
 *                 type: string
 *                 maxLength: 100
 *     responses:
 *       201:
 *         description: Location creada exitosamente
 *       400:
 *         description: Datos inválidos o location ya existe
 *       500:
 *         description: Error del servidor
 */
router.get("/locations", auth(), getLocations);
router.post("/locations", auth(), insertLocation);

/**
 * @swagger
 * /helpers/locations/tipo/{tipo}:
 *   get:
 *     summary: Obtener locations por tipo
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tipo
 *         required: true
 *         schema:
 *           type: string
 *         description: Tipo de location
 *     responses:
 *       200:
 *         description: Lista de locations del tipo especificado
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   tipo:
 *                     type: string
 *                   posicionX:
 *                     type: number
 *                   posicionY:
 *                     type: number
 *                   fechaCreado:
 *                     type: string
 *                     format: date
 *                   organizacion:
 *                     type: string
 *                   totalUsuarios:
 *                     type: integer
 *                   totalProductos:
 *                     type: integer
 *                   totalFabricacion:
 *                     type: integer
 *       400:
 *         description: Tipo de location requerido
 *       500:
 *         description: Error del servidor
 */
router.get("/locations/tipo/:tipo", auth(), getLocationsPorTipo);

/**
 * @swagger
 * /helpers/locations/{id}:
 *   get:
 *     summary: Obtener location por ID
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la location
 *     responses:
 *       200:
 *         description: Datos de la location
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 nombre:
 *                   type: string
 *                 tipo:
 *                   type: string
 *                 posicionX:
 *                   type: number
 *                 posicionY:
 *                   type: number
 *                 fechaCreado:
 *                   type: string
 *                   format: date
 *                 organizacion:
 *                   type: string
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Location no encontrada
 *       500:
 *         description: Error del servidor
 *   put:
 *     summary: Actualizar location
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la location
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 maxLength: 100
 *               tipo:
 *                 type: string
 *                 maxLength: 50
 *               posicionX:
 *                 type: number
 *               posicionY:
 *                 type: number
 *               organizacion:
 *                 type: string
 *                 maxLength: 100
 *     responses:
 *       200:
 *         description: Location actualizada exitosamente
 *       400:
 *         description: Datos inválidos o no hay datos para actualizar
 *       404:
 *         description: Location no encontrada
 *       500:
 *         description: Error del servidor
 *   delete:
 *     summary: Eliminar location
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la location
 *     responses:
 *       200:
 *         description: Location eliminada exitosamente
 *       400:
 *         description: ID inválido o location tiene dependencias
 *       404:
 *         description: Location no encontrada
 *       500:
 *         description: Error del servidor
 */
router.get("/locations/:id", auth(), getLocationById);
router.put("/locations/:id", auth(), updateLocation);
router.delete("/locations/:id", auth(), deleteLocation);

/**
 * @swagger
 * /helpers/locations/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de locations
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de locations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 porTipo:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tipo:
 *                         type: string
 *                       totalLocations:
 *                         type: integer
 *                       totalUsuarios:
 *                         type: integer
 *                       totalInventario:
 *                         type: integer
 *                       totalFabricacion:
 *                         type: integer
 *                       stockTotal:
 *                         type: number
 *                 totales:
 *                   type: object
 *                   properties:
 *                     totalLocations:
 *                       type: integer
 *                     totalUsuarios:
 *                       type: integer
 *                     totalInventario:
 *                       type: integer
 *                     totalFabricacion:
 *                       type: integer
 *                     stockTotal:
 *                       type: number
 *       500:
 *         description: Error del servidor
 */
router.get("/locations/estadisticas", auth(), getEstadisticasLocations);

/**
 * @swagger
 * /helpers/tipos-location:
 *   get:
 *     summary: Obtener tipos de location únicos
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tipos de location
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   tipo:
 *                     type: string
 *                   cantidad:
 *                     type: integer
 *       500:
 *         description: Error del servidor
 */
router.get("/tipos-location", auth(), getTiposLocation);

/**
 * @swagger
 * /helpers/locations/cercanas:
 *   get:
 *     summary: Obtener locations cercanas a coordenadas específicas
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: x
 *         required: true
 *         schema:
 *           type: number
 *         description: Coordenada X
 *       - in: query
 *         name: y
 *         required: true
 *         schema:
 *           type: number
 *         description: Coordenada Y
 *       - in: query
 *         name: radio
 *         schema:
 *           type: number
 *           default: 100
 *         description: Radio de búsqueda
 *     responses:
 *       200:
 *         description: Lista de locations cercanas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   tipo:
 *                     type: string
 *                   posicionX:
 *                     type: number
 *                   posicionY:
 *                     type: number
 *                   distancia:
 *                     type: number
 *       400:
 *         description: Coordenadas requeridas
 *       500:
 *         description: Error del servidor
 */
router.get("/locations/cercanas", auth(), getLocationsCercanas);

module.exports = router;