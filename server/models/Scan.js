const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  targetUrl: { type: String, required: true },
  domain: { type: String, required: true },
  score: { type: Number, required: true },
  grade: { type: String, required: true },
  redirectChain: { type: Array, default: [] },
  headerResults: { type: Array, default: [] },
  cookieResults: { type: Array, default: [] },
  aiEnrichment: { type: Object, default: {} },
  scannedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Scan', scanSchema);
