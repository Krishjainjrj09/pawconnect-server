const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [60, 'Name cannot exceed 60 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email address']
  },
  password: {
    type: String,
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  phone: { type: String, trim: true },
  role: {
    type: String,
    enum: ['user', 'shelter', 'admin'],
    default: 'user'
  },
  photo: { type: String, default: '' },
  googleId: { type: String },
  isActive: { type: Boolean, default: true },
  favourites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pet' }],
  myPets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pet' }],
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);