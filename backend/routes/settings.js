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
  // Forzar que OTP esté desactivado para Cloud Foundry
  const otpEnabled = false; // Forzar a false para desactivar OTP
  const otpRequired = false; // Forzar a false para desactivar OTP
  
  console.log("OTP settings requested - FORCING DISABLED:", { otpEnabled, otpRequired });
  
  res.json({
    enabled: otpEnabled,
    required: otpRequired
  });
});

module.exports = router;
