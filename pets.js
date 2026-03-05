const express = require('express');
const router  = express.Router();
const Pet     = require('../models/Pet');
const User    = require('../models/User');
const AdoptionRequest = require('../models/AdoptionRequest');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      species, gender, size, status = 'available',
      vaccinated, search,
      page = 1, limit = 12, sort = '-createdAt'
    } = req.query;

    const filter = {};
    if (species)   filter.species   = species;
    if (gender)    filter.gender    = gender;
    if (size)      filter.size      = size;
    if (status !== 'all') filter.status = status;
    if (vaccinated === 'true') filter.vaccinated = true;
    if (search) filter.$text = { $search: search };

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Pet.countDocuments(filter);
    const pets  = await Pet.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .select('-vaccines -weightHistory');

    let favSet = new Set();
    if (req.user) {
      const u = await User.findById(req.user._id).select('favourites');
      favSet = new Set(u.favourites.map(String));
    }

    const data = pets.map(p => ({
      ...p.toObject(),
      isFavourite: favSet.has(String(p._id)),
    }));

    res.json({ ok: true, total, page: Number(page), pages: Math.ceil(total / limit), data });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id).populate('addedBy', 'name email');
    if (!pet) return res.status(404).json({ ok: false, message: 'Pet not found.' });
    res.json({ ok: true, data: pet });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

router.post('/', protect, authorize('admin', 'shelter'), async (req, res) => {
  try {
    const pet = await Pet.create({ ...req.body, addedBy: req.user._id });
    res.status(201).json({ ok: true, data: pet });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
});

router.put('/:id', protect, authorize('admin', 'shelter'), async (req, res) => {
  try {
    const pet = await Pet.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!pet) return res.status(404).json({ ok: false, message: 'Pet not found.' });
    res.json({ ok: true, data: pet });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const pet = await Pet.findByIdAndDelete(req.params.id);
    if (!pet) return res.status(404).json({ ok: false, message: 'Pet not found.' });
    res.json({ ok: true, message: 'Pet deleted.' });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

router.post('/:id/favourite', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const idx  = user.favourites.indexOf(req.params.id);
    let added;
    if (idx > -1) { user.favourites.splice(idx, 1); added = false; }
    else           { user.favourites.push(req.params.id); added = true; }
    await user.save();
    res.json({ ok: true, added });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

router.post('/:id/adopt', protect, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) return res.status(404).json({ ok: false, message: 'Pet not found.' });
    if (pet.status !== 'available') {
      return res.status(400).json({ ok: false, message: 'This pet is no longer available.' });
    }
    const existing = await AdoptionRequest.findOne({
      pet: pet._id, applicant: req.user._id, status: 'pending'
    });
    if (existing) {
      return res.status(409).json({ ok: false, message: 'You already have a pending request for this pet.' });
    }
    const request = await AdoptionRequest.create({
      pet: pet._id,
      applicant: req.user._id,
      applicantName:  req.user.name,
      applicantEmail: req.user.email,
      applicantPhone: req.body.phone || '',
      message: req.body.message || '',
    });
    pet.status = 'pending';
    await pet.save();
    res.status(201).json({ ok: true, data: request, message: '🎉 Adoption request submitted!' });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;