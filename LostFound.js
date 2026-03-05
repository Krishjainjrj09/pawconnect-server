const mongoose = require('mongoose');

const lfSchema = new mongoose.Schema({
  type:     { type: String, enum: ['lost', 'found'], required: true },
  name:     { type: String, trim: true, default: 'Unknown' },
  species:  { type: String, trim: true },
  breed:    { type: String, trim: true },
  color:    { type: String, trim: true },
  gender:   { type: String, enum: ['male', 'female', 'unknown'], default: 'unknown' },
  location: { type: String, required: true, trim: true },
  date:     { type: Date, required: true, default: Date.now },
  description: { type: String, required: true, trim: true },
  photo:    { type: String, default: '' },
  contact:  { type: String, required: true, trim: true },
  reward:   { type: String, trim: true },
  resolved: { type: Boolean, default: false },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

lfSchema.index({ location: 'text', description: 'text', name: 'text' });

module.exports = mongoose.model('LostFound', lfSchema);