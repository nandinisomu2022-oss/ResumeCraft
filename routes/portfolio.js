const express = require('express');
const router = express.Router();
const Portfolio = require('../models/Portfolio');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   POST /api/portfolio
// @desc    Create/save portfolio
router.post('/', protect, async (req, res) => {
  try {
    const data = req.body;
    const portfolio = await Portfolio.create({ ...data, userId: req.user._id });
    await User.findByIdAndUpdate(req.user._id, { $inc: { portfolioCount: 1 } });
    res.status(201).json({ success: true, portfolio });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to save portfolio' });
  }
});

// @route   GET /api/portfolio/my
// @desc    Get all portfolios for logged-in user
router.get('/my', protect, async (req, res) => {
  try {
    const portfolios = await Portfolio.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, portfolios });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/portfolio/share/:shareId
// @desc    Get portfolio by shareId (public)
router.get('/share/:shareId', async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ shareId: req.params.shareId, isPublic: true });
    if (!portfolio) return res.status(404).json({ success: false, message: 'Portfolio not found' });
    // Increment views
    portfolio.views += 1;
    await portfolio.save();
    res.json({ success: true, portfolio });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/portfolio/:id
// @desc    Get portfolio by MongoDB id (owner)
router.get('/:id', protect, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ _id: req.params.id, userId: req.user._id });
    if (!portfolio) return res.status(404).json({ success: false, message: 'Portfolio not found' });
    res.json({ success: true, portfolio });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/portfolio/:id
// @desc    Update portfolio
router.put('/:id', protect, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!portfolio) return res.status(404).json({ success: false, message: 'Portfolio not found' });
    res.json({ success: true, portfolio });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update portfolio' });
  }
});

// @route   DELETE /api/portfolio/:id
// @desc    Delete portfolio
router.delete('/:id', protect, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!portfolio) return res.status(404).json({ success: false, message: 'Portfolio not found' });
    await User.findByIdAndUpdate(req.user._id, { $inc: { portfolioCount: -1 } });
    res.json({ success: true, message: 'Portfolio deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete portfolio' });
  }
});

// @route   GET /api/portfolio/:id/download
// @desc    Download portfolio as HTML
router.get('/:id/download', protect, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ _id: req.params.id, userId: req.user._id });
    if (!portfolio) return res.status(404).json({ success: false, message: 'Not found' });
    const html = generatePortfolioHTML(portfolio);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${portfolio.name.replace(/\s/g, '_')}_portfolio.html"`);
    res.send(html);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate HTML' });
  }
});

// Generate full HTML page for download
function generatePortfolioHTML(p) {
  const themeMap = {
    flatly: 'flatly', darkly: 'darkly', cyborg: 'cyborg', lux: 'lux',
    pulse: 'pulse', morph: 'morph', vapor: 'vapor', superhero: 'superhero',
    quartz: 'quartz', sketchy: 'sketchy', cosmo: 'cosmo', united: 'united',
    zephyr: 'zephyr', slate: 'slate', solar: 'solar', minty: 'minty',
  };
  const theme = themeMap[p.theme] || 'flatly';
  const skillsHTML = (p.skills || []).map(s => `<span class="badge bg-primary me-1 mb-1">${s}</span>`).join('');
  const projectsHTML = (p.projects || []).map(pr => `
    <div class="col-md-4 mb-4">
      <div class="card h-100 shadow-sm">
        <div class="card-body">
          <h5 class="card-title">${pr.title}</h5>
          <p class="card-text">${pr.description}</p>
          ${pr.link ? `<a href="${pr.link}" class="btn btn-sm btn-outline-primary" target="_blank">View Project</a>` : ''}
        </div>
      </div>
    </div>`).join('');
  const expHTML = (p.experience || []).map((e, i) => `
    <div class="d-flex mb-4">
      <div class="flex-shrink-0 me-3">
        <div class="bg-primary rounded-circle d-flex align-items-center justify-content-center" style="width:40px;height:40px;color:white;font-weight:bold;">${i + 1}</div>
      </div>
      <div>
        <h5 class="mb-0">${e.role}</h5>
        <p class="text-muted mb-1">${e.company} &bull; ${e.duration}</p>
        <p>${e.description}</p>
      </div>
    </div>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${p.name} - Portfolio</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootswatch@5.3.2/dist/${theme}/bootstrap.min.css">
<style>body{font-family:'Segoe UI',sans-serif;} .hero{padding:80px 0;} .avatar{width:150px;height:150px;border-radius:50%;object-fit:cover;}</style>
</head>
<body>
<nav class="navbar navbar-expand-lg navbar-dark bg-primary"><div class="container"><span class="navbar-brand fw-bold">${p.name}</span></div></nav>
<section class="hero text-center">
<div class="container">
${p.profileImage ? `<img src="${p.profileImage}" class="avatar mb-3" alt="Profile">` : ''}
<h1 class="display-4 fw-bold">${p.name}</h1>
<p class="lead text-muted">${p.title}</p>
<div class="mt-3">${p.email ? `<a href="mailto:${p.email}" class="btn btn-outline-primary me-2">Email</a>` : ''}${p.github ? `<a href="${p.github}" class="btn btn-dark me-2" target="_blank">GitHub</a>` : ''}${p.linkedin ? `<a href="${p.linkedin}" class="btn btn-info" target="_blank">LinkedIn</a>` : ''}</div>
</div></section>
<div class="container py-5">
${p.about ? `<section class="mb-5"><h2 class="fw-bold">About Me</h2><hr><p class="lead">${p.about}</p></section>` : ''}
${p.skills?.length ? `<section class="mb-5"><h2 class="fw-bold">Skills</h2><hr><div>${skillsHTML}</div></section>` : ''}
${p.projects?.length ? `<section class="mb-5"><h2 class="fw-bold">Projects</h2><hr><div class="row">${projectsHTML}</div></section>` : ''}
${p.experience?.length ? `<section class="mb-5"><h2 class="fw-bold">Experience</h2><hr>${expHTML}</section>` : ''}
</div>
<footer class="text-center py-4 bg-body-tertiary mt-5"><p class="mb-0">Generated with ResumeCraft &bull; Views: ${p.views}</p></footer>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body></html>`;
}

module.exports = router;
