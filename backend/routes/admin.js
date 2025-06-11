const express = require('express');
const router = express.Router();
const { 
  getPedidosPymes,
  aprobarPedidoPyme,
  rechazarPedidoPyme,
  getDetallePedidoPyme
} = require('../controllers/pedidosPymesController');

// Rutas para pedidos PYMES
router.get('/pedidos-pymes', getPedidosPymes);
router.put('/pedido-pyme/:id/aprobar', aprobarPedidoPyme);
router.put('/pedido-pyme/:id/rechazar', rechazarPedidoPyme);
router.get('/pedido-pyme/:id/detalle', getDetallePedidoPyme);

module.exports = router; 