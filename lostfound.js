const express = require('express');
const router  = express.Router();
const LostFound = require('../models/LostFound');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { type, species, resolved = 'false', search, page = 1, limit = 12 } = req.query;
    const filter = {};
    if (type)    filter.type    = type;
    if (species) filter.species = species;
    if (resolved !== 'all') filter.resolved = resolved === 'true';
    if (search)  filter.$text   = { $search: search };

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await LostFound.countDocuments(filter);
    const data  = await LostFound.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))
      .populate('reportedBy', 'name');

    res.json({ ok: true, total, page: Number(page), pages: Math.ceil(total / limit), data });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const report = await LostFound.findById(req.params.id).populate('reportedBy', 'name email');
    if (!report) return res.status(404).json({ ok: false, message: 'Report not found.' });
    res.json({ ok: true, data: report });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const report = await LostFound.create({ ...req.body, reportedBy: req.user._id });
    res.status(201).json({ ok: true, data: report });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const report = await LostFound.findById(req.params.id);
    if (!report) return res.status(404).json({ ok: false, message: 'Report not found.' });
    const isOwner = String(report.reportedBy) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, message: 'Not authorized.' });
    }
    const updated = await LostFound.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ ok: true, data: updated });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const report = await LostFound.findById(req.params.id);
    if (!report) return res.status(404).json({ ok: false, message: 'Report not found.' });
    const isOwner = String(report.reportedBy) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, message: 'Not authorized.' });
    }
    await report.deleteOne();
    res.json({ ok: true, message: 'Report deleted.' });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

router.patch('/:id/resolve', protect, async (req, res) => {
  try {
    const report = await LostFound.findById(req.params.id);
    if (!report) return res.status(404).json({ ok: false, message: 'Report not found.' });
    const isOwner = String(report.reportedBy) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, message: 'Not authorized.' });
    }
    report.resolved = true;
    await report.save();
    res.json({ ok: true, message: 'Marked as resolved 🎉', data: report });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;