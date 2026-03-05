const express = require('express');
const router  = express.Router();
const AdoptionRequest = require('../models/AdoptionRequest');
const { protect } = require('../middleware/auth');

router.post('/', protect, async (req, res) => {
  try {
    const { petId, applicantName, applicantEmail, applicantPhone } = req.body;
    const request = await AdoptionRequest.create({
      pet: petId,
      applicant: req.user._id,
      applicantName,
      applicantEmail,
      applicantPhone,
      status: 'pending'
    });
    res.status(201).json({ ok: true, data: request });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
});

module.exports = router;