const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scanController');
const scanRateLimiter = require('../middleware/rateLimiter');

// Scan Endpoints
router.post('/scan', scanRateLimiter, scanController.createScan);
router.get('/history', scanController.getScanHistory);
router.get('/compare', scanController.compareScans);
router.get('/scan/:id', scanController.getScanById);
router.delete('/history', scanController.clearHistory);

module.exports = router;
