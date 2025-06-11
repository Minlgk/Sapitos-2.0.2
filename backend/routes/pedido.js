const express = require("express");
const {
  getPedido,
  insertPedido,
  deletePedido,
  updatePedido,
  getProveedores,
  getProductosPorProveedor,
  aprobarPedido,
  entregarPedido,
  getPedidosProveedor,
  getDetallesPedido,
  enviarAInventario,
  getProveedoresInventario,
  getProductosInventarioPorProveedor,
  getAvailableLocations,
  actualizarEstatus,
  getProductosWarehouse
} = require('../controllers/pedidosController');
const router = express.Router();
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Pedido:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del pedido
 *         creadaPor:
 *           type: string
 *           description: Correo del usuario que creó el pedido
 *         creadoPorNombre:
 *           type: string
 *           description: Nombre del usuario que creó el pedido
 *         organizacion:
 *           type: string
 *           description: Nombre del proveedor/organización
 *         tipoOrden:
 *           type: string
 *           description: Tipo de orden (Compra, etc.)
 *         fechaCreacion:
 *           type: string
 *           format: date
 *           description: Fecha de creación del pedido
 *         fechaAceptacion:
 *           type: string
 *           format: date
 *           description: Fecha de aceptación del pedido
 *         fechaEstimaPago:
 *           type: string
 *           format: date
 *           description: Fecha límite de pago
 *         fechaEstimaEntrega:
 *           type: string
 *           format: date
 *           description: Fecha estimada de entrega
 *         fechaEntrega:
 *           type: string
 *           format: date
 *           description: Fecha real de entrega
 *         entregaATiempo:
 *           type: boolean
 *           description: Si la entrega fue a tiempo
 *         estatus:
 *           type: string
 *           enum: [Pendiente, Aprobado, En Reparto, Completado]
 *           description: Estado actual del pedido
 *         total:
 *           type: number
 *           description: Total del pedido
 *         metodoPago:
 *           type: string
 *           description: Método de pago utilizado
 *         descuentoAplicado:
 *           type: number
 *           description: Descuento aplicado al pedido
 *         tiempoReposicion:
 *           type: number
 *           description: Tiempo de reposición en días
 *         tiempoEntrega:
 *           type: number
 *           description: Tiempo real de entrega en días
 *     
 *     NuevoPedido:
 *       type: object
 *       required:
 *         - creadoPorId
 *         - organizacion
 *         - productos
 *         - total
 *       properties:
 *         creadoPorId:
 *           type: integer
 *           description: ID del usuario que crea el pedido
 *         organizacion:
 *           type: string
 *           description: Nombre del proveedor
 *         productos:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               articuloId:
 *                 type: integer
 *               cantidad:
 *                 type: integer
 *               precio:
 *                 type: number
 *         total:
 *           type: number
 *           description: Total del pedido
 *         metodoPagoId:
 *           type: integer
 *           default: 1
 *         descuentoAplicado:
 *           type: number
 *           default: 0
 *         tipoOrden:
 *           type: string
 *           default: "Compra"
 *     
 *     Proveedor:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *           description: Nombre del proveedor
 *         totalProductos:
 *           type: integer
 *           description: Total de productos que fabrica
 *     
 *     ProductoProveedor:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         articuloId:
 *           type: integer
 *         nombre:
 *           type: string
 *         categoria:
 *           type: string
 *         stockActual:
 *           type: integer
 *         precioCompra:
 *           type: number
 *         precioVenta:
 *           type: number
 *         temporada:
 *           type: string
 *         fechaUltimaCompra:
 *           type: string
 *           format: date
 *         proveedor:
 *           type: string
 *         precio:
 *           type: number
 */

/**
 * @swagger
 * /pedido:
 *   get:
 *     summary: Obtener todos los pedidos
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pedido'
 *       500:
 *         description: Error del servidor
 */
router.get("/", getPedido);


/**
 * @swagger
 * /pedido:
 *   post:
 *     summary: Crear nuevo pedido a proveedor
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NuevoPedido'
 *     responses:
 *       201:
 *         description: Pedido creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 id:
 *                   type: integer
 *                 pedidoId:
 *                   type: integer
 *                 totalProductos:
 *                   type: integer
 *                 total:
 *                   type: number
 *                 organizacion:
 *                   type: string
 *       400:
 *         description: Datos incompletos o inválidos
 *       500:
 *         description: Error del servidor
 */
router.post("/", insertPedido);


/**
 * @swagger
 * /pedido/{id}:
 *   put:
 *     summary: Actualizar pedido
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               organizacion:
 *                 type: string
 *               total:
 *                 type: number
 *               descuentoAplicado:
 *                 type: number
 *               tiempoReposicion:
 *                 type: number
 *     responses:
 *       200:
 *         description: Pedido actualizado exitosamente
 *       400:
 *         description: ID inválido o datos incorrectos
 *       500:
 *         description: Error del servidor
 */
router.put("/:id", updatePedido);


/**
 * @swagger
 * /pedido/{id}:
 *   delete:
 *     summary: Eliminar pedido
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pedido
 *     responses:
 *       200:
 *         description: Pedido eliminado exitosamente
 *       400:
 *         description: ID de pedido inválido
 *       404:
 *         description: Pedido no encontrado
 *       500:
 *         description: Error del servidor
 */
router.delete("/:id", deletePedido);


/**
 * @swagger
 * /pedido/proveedores:
 *   get:
 *     summary: Obtener lista de proveedores
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de proveedores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Proveedor'
 *       500:
 *         description: Error del servidor
 */
router.get("/proveedores", getProveedores);


/**
 * @swagger
 * /pedido/productos/{nombreProveedor}:
 *   get:
 *     summary: Obtener productos por proveedor
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: nombreProveedor
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del proveedor (URL encoded)
 *     responses:
 *       200:
 *         description: Lista de productos del proveedor
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductoProveedor'
 *       400:
 *         description: Nombre de proveedor requerido
 *       500:
 *         description: Error del servidor
 */
router.get("/productos/:nombreProveedor", getProductosPorProveedor);

/**
 * @swagger
 * /pedido/{id}/aprobar:
 *   put:
 *     summary: Aprobar pedido (para proveedores)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pedido
 *     responses:
 *       200:
 *         description: Pedido aprobado exitosamente
 *       400:
 *         description: ID inválido o pedido no puede ser aprobado
 *       404:
 *         description: Pedido no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put("/:id/aprobar", aprobarPedido);


/**
 * @swagger
 * /pedido/{id}/entregar:
 *   put:
 *     summary: Marcar pedido como entregado/enviado (para proveedores)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pedido
 *     responses:
 *       200:
 *         description: Pedido marcado como enviado y stock actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 totalProductos:
 *                   type: integer
 *       400:
 *         description: ID inválido o pedido no puede ser enviado
 *       404:
 *         description: Pedido no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put("/:id/entregar", entregarPedido);


/**
 * @swagger
 * /pedido/{id}/inventario:
 *   put:
 *     summary: Recibir pedido y agregar al inventario (para admin)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pedido
 *     responses:
 *       200:
 *         description: Productos agregados al inventario exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 totalProductos:
 *                   type: integer
 *                 pedidoId:
 *                   type: integer
 *       400:
 *         description: ID inválido o pedido no puede ser recibido
 *       404:
 *         description: Pedido no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put("/:id/inventario", enviarAInventario);


/**
 * @swagger
 * /pedido/proveedor/{correo}:
 *   get:
 *     summary: Obtener pedidos de un proveedor específico
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: correo
 *         required: true
 *         schema:
 *           type: string
 *         description: Correo del proveedor
 *     responses:
 *       200:
 *         description: Lista de pedidos del proveedor
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ID:
 *                     type: integer
 *                   Organizacion:
 *                     type: string
 *                   FechaCreacion:
 *                     type: string
 *                     format: date
 *                   FechaAceptacion:
 *                     type: string
 *                     format: date
 *                   FechaEstimadaEntrega:
 *                     type: string
 *                     format: date
 *                   FechaEntrega:     
 *                     type: string
 *                     format: date
 *                   Estado:
 *                     type: string
 *                   Total:
 *                     type: number
 *                   SolicitadoPor:
 *                     type: string
 *       400:
 *         description: Correo del proveedor requerido
 *       500:
 *         description: Error del servidor
 */
router.get("/proveedor/:correo", getPedidosProveedor);


/**
 * @swagger
 * /pedido/{id}/detalles:
 *   get:
 *     summary: Obtener detalles de un pedido
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pedido
 *     responses:
 *       200:
 *         description: Detalles del pedido
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ID:
 *                     type: integer
 *                   NOMBRE:
 *                     type: string
 *                   CATEGORIA:
 *                     type: string
 *                   CANTIDAD:
 *                     type: integer
 *                   PRECIOUNITARIO:
 *                     type: number
 *                   TOTAL:
 *                     type: number
 *       400:
 *         description: ID de pedido inválido
 *       500:
 *         description: Error del servidor
 */
router.get("/:id/detalles", getDetallesPedido);


/**
 * @swagger
 * /pedido/inventario/proveedores:
 *   get:
 *     summary: Obtener proveedores para inventario (alias de /proveedores)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de proveedores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Proveedor'
 *       500:
 *         description: Error del servidor
 */
router.get("/inventario/proveedores", getProveedoresInventario);


/**
 * @swagger
 * /pedido/inventario/productos/{nombreProveedor}:
 *   get:
 *     summary: Obtener productos por proveedor para inventario (alias de /productos/{nombreProveedor})
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: nombreProveedor
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del proveedor (URL encoded)
 *     responses:
 *       200:
 *         description: Lista de productos del proveedor
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductoProveedor'
 *       400:
 *         description: Nombre de proveedor requerido
 *       500:
 *         description: Error del servidor
 */
router.get("/inventario/productos/:nombreProveedor", getProductosInventarioPorProveedor);


/**
 * @swagger
 * /pedido/locations:
 *   get:
 *     summary: Obtener ubicaciones disponibles para envío al inventario
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ubicaciones disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: ID de la ubicación
 *                   nombre:
 *                     type: string
 *                     description: Nombre de la ubicación
 *                   tipo:
 *                     type: string
 *                     description: Tipo de ubicación
 *                   direccion:
 *                     type: string
 *                     description: Dirección de la ubicación
 *       500:
 *         description: Error del servidor
 */
router.get("/locations", getAvailableLocations);


/**
 * @swagger
 * /pedido/{id}/estatus:
 *   patch:
 *     summary: Actualizar estatus del pedido (para administradores)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estatus
 *             properties:
 *               estatus:
 *                 type: string
 *                 enum: [Pendiente, Aprobado, En Reparto, Completado]
 *                 description: Nuevo estatus del pedido
 *     responses:
 *       200:
 *         description: Estatus actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 estatus:
 *                   type: string
 *       400:
 *         description: ID inválido o estatus requerido
 *       404:
 *         description: Pedido no encontrado
 *       500:
 *         description: Error del servidor
 */
router.patch("/:id/estatus", actualizarEstatus);

/**
 * @swagger
 * /pedido/warehouse/productos:
 *   get:
 *     summary: Obtener productos de la warehouse (location_id = 1)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de productos disponibles en la warehouse
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductoProveedor'
 *       500:
 *         description: Error del servidor
 */
router.get("/warehouse/productos", getProductosWarehouse);

module.exports = router;