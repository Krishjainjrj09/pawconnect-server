const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const Pet     = require('../models/Pet');
const LostFound = require('../models/LostFound');
const AdoptionRequest = require('../models/AdoptionRequest');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/stats', async (req, res) => {
  try {
    const [users, pets, lf, pendingAdoptions] = await Promise.all([
      User.countDocuments(),
      Pet.countDocuments(),
      LostFound.countDocuments({ resolved: false }),
      AdoptionRequest.countDocuments({ status: 'pending' }),
    ]);

    const bySpecies = await Pet.aggregate([
      { $group: { _id: '$species', count: { $sum: 1 } } }
    ]);

    const byStatus = await Pet.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthly = await AdoptionRequest.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({ ok: true, stats: { users, pets, lf, pendingAdoptions, bySpecies, byStatus, monthly } });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const filter = {};
    if (role) filter.role = role;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(filter);
    const data  = await User.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)).select('-password');
    res.json({ ok: true, total, data });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const { role, isActive } = req.body;
    const update = {};
    if (role !== undefined)     update.role     = role;
    if (isActive !== undefined) update.isActive = isActive;
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ ok: false, message: 'User not found.' });
    res.json({ ok: true, data: user });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
});

router.get('/adoptions', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await AdoptionRequest.countDocuments(filter);
    const data  = await AdoptionRequest.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))
      .populate('pet', 'name species photos')
      .populate('applicant', 'name email');
    res.json({ ok: true, total, data });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

router.patch('/adoptions/:id', async (req, res) => {
  try {
    const { status, reviewNote } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ ok: false, message: 'Status must be approved or rejected.' });
    }
    const request = await AdoptionRequest.findById(req.params.id).populate('pet');
    if (!request) return res.status(404).json({ ok: false, message: 'Request not found.' });
    request.status     = status;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.reviewNote = reviewNote || '';
    await request.save();
    if (status === 'approved') {
      await Pet.findByIdAndUpdate(request.pet._id, { status: 'adopted' });
      await AdoptionRequest.updateMany(
        { pet: request.pet._id, _id: { $ne: request._id }, status: 'pending' },
        { status: 'rejected', reviewNote: 'Pet has been adopted by another applicant.' }
      );
    } else {
      const otherPending = await AdoptionRequest.countDocuments({
        pet: request.pet._id, status: 'pending'
      });
      if (otherPending === 0) {
        await Pet.findByIdAndUpdate(request.pet._id, { status: 'available' });
      }
    }
    res.json({ ok: true, data: request, message: `Request ${status}.` });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

router.get('/lostfound', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await LostFound.countDocuments();
    const data  = await LostFound.find().sort('-createdAt').skip(skip).limit(Number(limit)).populate('reportedBy', 'name email');
    res.json({ ok: true, total, data });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});


router.get('/pets', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Pet.countDocuments();
    const data  = await Pet.find().sort('-createdAt').skip(skip).limit(Number(limit));
    res.json({ ok: true, total, data });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

router.post('/pets', async (req, res) => {
  try {
    const pet = await Pet.create({ ...req.body, addedBy: req.user._id });
    res.status(201).json({ ok: true, data: pet });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
});

module.exports = router;