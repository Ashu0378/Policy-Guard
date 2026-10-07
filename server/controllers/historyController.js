const Scan = require('../models/Scan');

exports.getHistory = async (req, res) => {
  try {
    const scans = await Scan.find()
      .select('domain score grade scannedAt targetUrl')
      .sort({ scannedAt: -1 })
      .limit(10);
    res.json(scans);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch scan history.' });
  }
};

exports.compareScans = async (req, res) => {
  try {
    const { domainA, domainB } = req.query;
    if (!domainA || !domainB) {
      return res.status(400).json({ error: 'Please provide both domainA and domainB query parameters.' });
    }

    const scanA = await Scan.findOne({ domain: domainA }).sort({ scannedAt: -1 });
    const scanB = await Scan.findOne({ domain: domainB }).sort({ scannedAt: -1 });

    res.json({
      scanA,
      scanB
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch compare data.' });
  }
};
