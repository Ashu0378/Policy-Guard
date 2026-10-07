const Scan = require('../models/Scan');
const { scanTarget } = require('../utils/scannerEngine');
const { getIsConnected } = require('../config/db');
const { enrichScanResults } = require('../services/aiService');

// In-memory fallback storage when MongoDB is not connected
const inMemoryScans = [];

/**
 * Controller: Execute new Security Scan
 * POST /api/scan
 */
exports.createScan = async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Target URL is required.'
    });
  }

  try {
    const scanData = await scanTarget(url);
    
    // Feature 1: AI Integration Layer
    scanData.aiEnrichment = await enrichScanResults({
      domain: scanData.domain,
      score: scanData.score,
      grade: scanData.grade,
      missingHeaders: scanData.headerResults.filter(h => h.status === 'MISSING').map(h => h.name),
      cookies: scanData.cookieResults.map(c => c.name)
    });

    let savedResult = scanData;

    if (getIsConnected()) {
      try {
        const scanDocument = new Scan(scanData);
        savedResult = await scanDocument.save();
      } catch (dbErr) {
        console.warn(`[Database Warning] Failed to save scan to MongoDB (${dbErr.message}). Using memory fallback.`);
      }
    }

    // Always keep in-memory backup for immediate retrieval
    scanData._id = savedResult._id ? savedResult._id.toString() : 'mem_' + Date.now();
    inMemoryScans.unshift(scanData);
    if (inMemoryScans.length > 20) inMemoryScans.pop();

    return res.status(200).json({
      success: true,
      data: savedResult
    });

  } catch (err) {
    console.error(`[Scan Controller Error] ${err.message}`);
    return res.status(400).json({
      success: false,
      error: err.message || 'An error occurred while scanning the target URL.'
    });
  }
};

/**
 * Controller: Get 10 Recent Scans History
 * GET /api/history
 */
exports.getScanHistory = async (req, res) => {
  try {
    let history = [];

    if (getIsConnected()) {
      try {
        history = await Scan.find({})
          .select('domain score grade scannedAt targetUrl')
          .sort({ scannedAt: -1 })
          .limit(10)
          .lean();
      } catch (dbErr) {
        console.warn(`[Database Warning] Error fetching history from MongoDB: ${dbErr.message}`);
        history = inMemoryScans.slice(0, 10).map(s => ({
          domain: s.domain, score: s.score, grade: s.grade, scannedAt: s.scannedAt, targetUrl: s.targetUrl
        }));
      }
    } else {
      history = inMemoryScans.slice(0, 10).map(s => ({
        domain: s.domain, score: s.score, grade: s.grade, scannedAt: s.scannedAt, targetUrl: s.targetUrl
      }));
    }

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve scan history.'
    });
  }
};

/**
 * Controller: Get Scan by ID
 * GET /api/scan/:id
 */
exports.getScanById = async (req, res) => {
  const { id } = req.params;

  try {
    if (getIsConnected() && !id.startsWith('mem_')) {
      const scan = await Scan.findById(id).lean();
      if (scan) {
        return res.status(200).json({ success: true, data: scan });
      }
    }

    const memScan = inMemoryScans.find(s => s._id === id || s.id === id);
    if (memScan) {
      return res.status(200).json({ success: true, data: memScan });
    }

    return res.status(404).json({
      success: false,
      error: 'Scan record not found.'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Error retrieving scan record.'
    });
  }
};

/**
 * Controller: Compare Scans
 * GET /api/compare?domainA=X&domainB=Y
 */
exports.compareScans = async (req, res) => {
  try {
    const { domainA, domainB } = req.query;
    if (!domainA || !domainB) {
      return res.status(400).json({ success: false, error: 'Please provide both domainA and domainB query parameters.' });
    }

    let scanA = null;
    let scanB = null;

    if (getIsConnected()) {
      scanA = await Scan.findOne({ domain: domainA }).sort({ scannedAt: -1 }).lean();
      scanB = await Scan.findOne({ domain: domainB }).sort({ scannedAt: -1 }).lean();
    } else {
      scanA = inMemoryScans.find(s => s.domain === domainA);
      scanB = inMemoryScans.find(s => s.domain === domainB);
    }

    return res.status(200).json({
      success: true,
      data: { scanA, scanB }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch compare data.'
    });
  }
};

/**
 * Controller: Clear Scan History
 * DELETE /api/history
 */
exports.clearHistory = async (req, res) => {
  try {
    if (getIsConnected()) {
      await Scan.deleteMany({});
    }
    inMemoryScans.length = 0;
    return res.status(200).json({
      success: true,
      message: 'Scan history cleared successfully.'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Failed to clear scan history.'
    });
  }
};
