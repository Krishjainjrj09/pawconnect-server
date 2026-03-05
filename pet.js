const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  species: {
    type: String,
    required: true,
    enum: ['dog', 'cat', 'rabbit', 'bird', 'other'],
    lowercase: true
  },
  breed:    { type: String, trim: true, default: 'Mixed' },
  age:      { type: String, required: true },
  ageMonths: { type: Number },
  gender:   { type: String, enum: ['male', 'female'], required: true },
  size:     { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
  color:    { type: String, trim: true },
  weight:   { type: String },
  location: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  photos: [{ type: String }],
  status: {
    type: String,
    enum: ['available', 'pending', 'adopted'],
    default: 'available'
  },
  vaccinated: { type: Boolean, default: false },
  neutered:   { type: Boolean, default: false },
  houseTrained: { type: Boolean, default: false },
  goodWithKids: { type: Boolean, default: false },
  goodWithPets: { type: Boolean, default: false },
  shelter: { type: String, trim: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vaccines: [{
    name:   { type: String },
    date:   { type: Date },
    nextDue: { type: Date },
    vet:    { type: String },
  }],
  weightHistory: [{
    weight: { type: Number },
    date:   { type: Date, default: Date.now },
  }],
}, { timestamps: true });

petSchema.index({ name: 'text', breed: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('Pet', petSchema);