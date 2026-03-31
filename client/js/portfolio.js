/* portfolio.js - Public Portfolio View */

const API_BASE_PUB = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const shareId = params.get('id');

  if (!shareId) {
    showNotFound();
    return;
  }

  try {
    const res = await fetch(`${API_BASE_PUB}/portfolio/share/${shareId}`);
    const data = await res.json();

    if (!data.success || !data.portfolio) {
      showNotFound();
      return;
    }

    renderPortfolio(data.portfolio);
  } catch (err) {
    showNotFound();
  }
});

function renderPortfolio(p) {
  // Load Bootswatch theme
  const themeLink = document.getElementById('bootstrap-theme');
  themeLink.href = `https://cdn.jsdelivr.net/npm/bootswatch@5.3.2/dist/${p.theme || 'flatly'}/bootstrap.min.css`;

  // Update page title and meta
  document.title = `${p.name} — Portfolio`;

  // Update navbar
  document.getElementById('navName').textContent = p.name || 'Portfolio';
  document.getElementById('portfolioNav').className = `navbar navbar-expand-lg navbar-dark bg-primary`;

  // Avatar
  const avatarContainer = document.getElementById('avatarContainer');
  if (p.profileImage) {
    avatarContainer.innerHTML = `<img src="http://localhost:5000${p.profileImage}" class="avatar-img" alt="${p.name}"/>`;
  } else {
    const initials = (p.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    avatarContainer.innerHTML = `<div class="avatar-placeholder">${initials}</div>`;
  }

  // Name & Title
  document.getElementById('heroName').textContent = p.name || '';
  document.getElementById('heroTitle').textContent = p.title || '';

  // Links
  const linksContainer = document.getElementById('heroLinks');
  const links = [
    p.email ? `<a href="mailto:${p.email}" class="btn btn-outline-light btn-sm"><i class="bi bi-envelope me-1"></i>${p.email}</a>` : '',
    p.phone ? `<span class="btn btn-outline-light btn-sm disabled"><i class="bi bi-telephone me-1"></i>${p.phone}</span>` : '',
    p.location ? `<span class="btn btn-outline-light btn-sm disabled"><i class="bi bi-geo-alt me-1"></i>${p.location}</span>` : '',
    p.github ? `<a href="${p.github}" class="btn btn-light btn-sm" target="_blank"><i class="bi bi-github me-1"></i>GitHub</a>` : '',
    p.linkedin ? `<a href="${p.linkedin}" class="btn btn-info btn-sm" target="_blank"><i class="bi bi-linkedin me-1"></i>LinkedIn</a>` : '',
  ].filter(Boolean).join('');
  linksContainer.innerHTML = links;

  // About
  if (p.about) {
    document.getElementById('aboutText').textContent = p.about;
    document.getElementById('aboutSection').style.display = '';
  }

  // Skills
  if (p.skills?.length) {
    const container = document.getElementById('skillsContainer');
    container.innerHTML = p.skills.map(s => `<span class="skill-badge">${s}</span>`).join('');
    document.getElementById('skillsSection').style.display = '';
  }

  // Projects
  if (p.projects?.length) {
    const container = document.getElementById('projectsContainer');
    container.innerHTML = p.projects.filter(pr => pr.title).map(pr => `
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 project-card shadow-sm">
          <div class="card-body">
            <h5 class="card-title fw-700">${pr.title}</h5>
            ${pr.tech ? `<p class="mb-2"><span class="badge bg-secondary">${pr.tech}</span></p>` : ''}
            <p class="card-text text-muted small">${pr.description || ''}</p>
          </div>
          <div class="card-footer bg-transparent">
            <div class="d-flex gap-2">
              ${pr.link ? `<a href="${pr.link}" class="btn btn-sm btn-primary" target="_blank"><i class="bi bi-box-arrow-up-right me-1"></i>Live</a>` : ''}
              ${pr.github ? `<a href="${pr.github}" class="btn btn-sm btn-outline-secondary" target="_blank"><i class="bi bi-github me-1"></i>Code</a>` : ''}
            </div>
          </div>
        </div>
      </div>`).join('');
    document.getElementById('projectsSection').style.display = '';
  }

  // Experience
  if (p.experience?.length) {
    const container = document.getElementById('experienceContainer');
    const exps = p.experience.filter(e => e.role);
    container.innerHTML = exps.map((e, i) => `
      <div class="timeline-item">
        <div style="display:flex;flex-direction:column;align-items:center">
          <div class="timeline-dot">${i + 1}</div>
          ${i < exps.length - 1 ? `<div class="timeline-line"></div>` : ''}
        </div>
        <div style="padding-top:8px;padding-bottom:${i < exps.length - 1 ? '8px' : '0'}">
          <h5 class="fw-700 mb-1">${e.role}</h5>
          <p class="text-muted mb-2"><strong>${e.company}</strong>${e.duration ? ` &bull; ${e.duration}` : ''}</p>
          ${e.description ? `<p class="text-muted small">${e.description}</p>` : ''}
        </div>
      </div>`).join('');
    document.getElementById('experienceSection').style.display = '';
  }

  // Education
  if (p.education?.length) {
    const container = document.getElementById('educationContainer');
    container.innerHTML = p.education.filter(e => e.degree).map(e => `
      <div class="d-flex gap-3 mb-3 p-3 rounded" style="background:var(--bs-secondary-bg)">
        <div style="font-size:2rem">🎓</div>
        <div>
          <h6 class="fw-700 mb-0">${e.degree}</h6>
          <p class="text-muted small mb-0">${e.institution}${e.year ? ` &bull; ${e.year}` : ''}</p>
        </div>
      </div>`).join('');
    document.getElementById('educationSection').style.display = '';
  }

  // Views counter
  const viewsEl = document.getElementById('viewCount');
  viewsEl.textContent = p.views || 0;
  document.getElementById('viewsCounter').style.display = '';
  document.getElementById('shareFab').style.display = '';

  // Show content, hide loading
  document.getElementById('loadingScreen').style.display = 'none';
  document.getElementById('portfolioContent').classList.remove('d-none');
}

function showNotFound() {
  document.getElementById('loadingScreen').style.display = 'none';
  document.getElementById('notFound').classList.remove('d-none');
}

function sharePortfolio() {
  const url = window.location.href;
  if (navigator.share) {
    navigator.share({ title: document.title, url });
  } else {
    navigator.clipboard.writeText(url).then(() => {
      const toast = new bootstrap.Toast(document.getElementById('shareToast'));
      toast.show();
    });
  }
}

window.sharePortfolio = sharePortfolio;
