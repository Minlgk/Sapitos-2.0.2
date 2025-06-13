const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/settings/otp:
 *   get:
 *     summary: Get OTP settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: OTP settings retrieved
 */
router.get('/otp', (req, res) => {
  // Obtener configuración de OTP desde variables de entorno
  const otpEnabled = process.env.AUTH_OTP === 'true';
  const otpRequired = process.env.AUTH_OTP_REQUIRED === 'true';
  
  console.log("OTP settings requested:", { otpEnabled, otpRequired });
  
  res.json({
    enabled: otpEnabled,
    required: otpRequired
  });
});

module.exports = router;
