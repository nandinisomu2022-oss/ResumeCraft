const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ProjectSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  link: { type: String, default: '' },
  github: { type: String, default: '' },
  tech: { type: String, default: '' },
});

const ExperienceSchema = new mongoose.Schema({
  role: { type: String, default: '' },
  company: { type: String, default: '' },
  duration: { type: String, default: '' },
  description: { type: String, default: '' },
});

const EducationSchema = new mongoose.Schema({
  degree: { type: String, default: '' },
  institution: { type: String, default: '' },
  year: { type: String, default: '' },
});

const PortfolioSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shareId: { type: String, default: () => uuidv4(), unique: true },
  name: { type: String, default: '', trim: true },
  title: { type: String, default: '' },
  about: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  website: { type: String, default: '' },
  github: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  skills: [{ type: String }],
  projects: [ProjectSchema],
  experience: [ExperienceSchema],
  education: [EducationSchema],
  theme: { type: String, default: 'flatly' },
  profileImage: { type: String, default: '' },
  resumeFile: { type: String, default: '' },
  isPublic: { type: Boolean, default: true },
  views: { type: Number, default: 0 },
  templateId: { type: String, default: 'classic' },
}, { timestamps: true });

PortfolioSchema.index({ userId: 1 });
PortfolioSchema.index({ shareId: 1 });

module.exports = mongoose.model('Portfolio', PortfolioSchema);
