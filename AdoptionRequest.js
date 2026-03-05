const mongoose = require('mongoose');

const adoptionSchema = new mongoose.Schema({
  pet:       { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  applicantName:  { type: String },
  applicantEmail: { type: String },
  applicantPhone: { type: String },
  message:   { type: String, trim: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  reviewNote: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('AdoptionRequest', adoptionSchema);