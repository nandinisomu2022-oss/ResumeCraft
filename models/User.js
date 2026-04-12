const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, minlength: 6 },
  googleId: { type: String },
  avatar: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  githubUsername: { type: String, default: '' },
  linkedinUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
  portfolioCount: { type: Number, default: 0 },
}, { timestamps: true });

UserSchema.index({ email: 1 });
UserSchema.index({ googleId: 1 });

module.exports = mongoose.model('User', UserSchema);
