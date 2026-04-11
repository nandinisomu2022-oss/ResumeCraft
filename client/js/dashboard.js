/* dashboard.js - Dashboard logic */

let uploadedFileData = null;
let allPortfolios = [];
let portfolioToDelete = null;

// Auth check
Auth.requireAuth();

// Init
document.addEventListener('DOMContentLoaded', () => {
  initUser();
  loadPortfolios();
  initDropZone();
});

function initUser() {
  const user = Auth.getUser();
  if (!user) return;
  const initials = (user.name || user.email || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('sidebarName').textContent = user.name || 'User';
  document.getElementById('dashboardUserLabel').textContent = `Signed in as ${user.name || 'User'}`;
  document.getElementById('pageSubtitle').textContent = `Welcome back, ${user.name?.split(' ')[0] || 'there'}! 👋`;

  const sidebarAvatar = document.getElementById('sidebarAvatar');
  const headerAvatar = document.getElementById('headerAvatar');

  if (user.avatar) {
    const img = `<img src="${user.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" onerror="this.style.display='none'"/>`;
    sidebarAvatar.innerHTML = img;
    headerAvatar.innerHTML = img;
  } else {
    sidebarAvatar.textContent = initials;
    headerAvatar.textContent = initials;
  }
}

// Load portfolios
async function loadPortfolios() {
  try {
    const res = await fetch(`${API_BASE}/portfolio/my`, { headers: Auth.apiHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    allPortfolios = data.portfolios || [];
    renderPortfolios(allPortfolios);
    updateStats();
  } catch (err) {
    console.error('Load portfolios error:', err);
    renderPortfolios([]);
  }
}

function updateStats() {
  document.getElementById('statPortfolios').textContent = allPortfolios.length;
  const totalViews = allPortfolios.reduce((a, p) => a + (p.views || 0), 0);
  document.getElementById('statViews').textContent = totalViews;
  document.getElementById('statShared').textContent = allPortfolios.filter(p => p.isPublic).length;
  document.getElementById('statDownloads').textContent = 0;
}

function renderPortfolios(portfolios) {
  const grid = document.getElementById('portfolioGrid');
  const count = document.getElementById('portfolioCount');
  count.textContent = `${portfolios.length} portfolio${portfolios.length !== 1 ? 's' : ''}`;

  if (portfolios.length === 0) {
    grid.innerHTML = `
      <div class="col-12">
        <div class="empty-state">
          <div class="empty-state-icon"><i class="bi bi-collection"></i></div>
          <h5>No portfolios yet</h5>
          <p class="text-muted small mb-3">Upload a resume or create a portfolio manually</p>
          <a href="editor.html?new=true" class="btn btn-primary-custom btn-sm">
            <i class="bi bi-plus-lg me-2"></i>Create Portfolio
          </a>
        </div>
      </div>`;
    return;
  }

  const themeColors = {
    flatly: '#18bc9c', darkly: '#375a7f', cyborg: '#2a9fd6', lux: '#1a1a1a',
    pulse: '#593196', morph: '#378dfc', vapor: '#6f42c1', quartz: '#6ea8fe',
    superhero: '#df6919', sketchy: '#333', cosmo: '#2780e3', united: '#e95420',
    slate: '#3a3f44', solar: '#b58900', minty: '#78c2ad',
  };

  grid.innerHTML = portfolios.map(p => {
    const color = themeColors[p.theme] || '#4f46e5';
    const date = new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `
      <div class="col-sm-6 col-xl-4">
        <div class="portfolio-grid-card">
          <div class="portfolio-card-header" style="background:linear-gradient(135deg,${color},${color}aa)">
            ${p.profileImage ? `<img src="http://localhost:5000${p.profileImage}" style="width:100%;height:100%;object-fit:cover;opacity:0.3"/>` : ''}
            <div class="portfolio-card-views"><i class="bi bi-eye me-1"></i>${p.views || 0}</div>
          </div>
          <div class="portfolio-card-body">
            <div class="portfolio-card-name">${p.name || 'Unnamed Portfolio'}</div>
            <div class="portfolio-card-title">${p.title || 'No title'}</div>
            <div class="portfolio-card-theme"><i class="bi bi-palette me-1"></i>${p.theme || 'flatly'}</div>
            <div class="text-muted small mb-3"><i class="bi bi-calendar3 me-1"></i>${date}</div>
            <div class="portfolio-card-actions">
              <a href="editor.html?id=${p._id}" class="btn btn-sm btn-outline-primary">
                <i class="bi bi-pencil"></i> Edit
              </a>
              <a href="portfolio.html?id=${p.shareId}" target="_blank" class="btn btn-sm btn-outline-success">
                <i class="bi bi-eye"></i> View
              </a>
              <button class="btn btn-sm btn-outline-info" onclick="openShareModal('${p.shareId}', '${p.name}')">
                <i class="bi bi-share"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="openDeleteModal('${p._id}')">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');
}

// Filter portfolios
function filterPortfolios(query) {
  const filtered = allPortfolios.filter(p =>
    (p.name || '').toLowerCase().includes(query.toLowerCase()) ||
    (p.title || '').toLowerCase().includes(query.toLowerCase())
  );
  renderPortfolios(filtered);
}

// Sort portfolios
function sortPortfolios(by) {
  let sorted = [...allPortfolios];
  if (by === 'newest') sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else if (by === 'oldest') sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  else if (by === 'views') sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
  renderPortfolios(sorted);
}

// Drop Zone
function initDropZone() {
  const zone = document.getElementById('dropZone');
  const input = document.getElementById('resumeFileInput');

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });
  input.addEventListener('change', (e) => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  });
}

function handleFile(file) {
  const allowed = ['.pdf', '.doc', '.docx'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowed.includes(ext)) {
    alert('Please upload a PDF or DOCX file only.');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    alert('File too large. Maximum size is 10MB.');
    return;
  }
  uploadedFileData = file;

  // Show file preview
  document.getElementById('dropText').classList.add('d-none');
  document.getElementById('filePreview').classList.remove('d-none');
  document.getElementById('fileName').textContent = file.name;
  document.getElementById('fileSize').textContent = formatFileSize(file.size);
  document.getElementById('generateBtn').disabled = false;
}

function clearFile() {
  uploadedFileData = null;
  document.getElementById('dropText').classList.remove('d-none');
  document.getElementById('filePreview').classList.add('d-none');
  document.getElementById('resumeFileInput').value = '';
  document.getElementById('generateBtn').disabled = true;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Generate Portfolio
async function generatePortfolio() {
  if (!uploadedFileData) return;
  const btn = document.getElementById('generateBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Parsing...';

  const progressDiv = document.getElementById('uploadProgress');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  progressDiv.classList.remove('d-none');

  // Animate progress
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress = Math.min(progress + Math.random() * 15, 90);
    progressBar.style.width = progress + '%';
    progressText.textContent = Math.round(progress) + '%';
  }, 300);

  try {
    const formData = new FormData();
    formData.append('resume', uploadedFileData);

    const res = await fetch(`${API_BASE}/upload/resume`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${Auth.getToken()}` },
      body: formData,
    });
    const data = await res.json();

    clearInterval(progressInterval);
    progressBar.style.width = '100%';
    progressText.textContent = '100%';

    if (!data.success) throw new Error(data.message);

    const portfolioId = data.portfolio?._id;
    if (portfolioId) {
      window.location.href = `editor.html?id=${portfolioId}`;
    } else {
      sessionStorage.setItem('parsed_resume', JSON.stringify(data.data));
      setTimeout(() => { window.location.href = 'editor.html?new=true&fromResume=true'; }, 500);
    }
  } catch (err) {
    clearInterval(progressInterval);
    progressDiv.classList.add('d-none');
    alert('Error: ' + (err.message || 'Failed to parse resume'));
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-magic me-2"></i>Generate Portfolio';
  }
}

// Delete Modal
function openDeleteModal(id) {
  portfolioToDelete = id;
  new bootstrap.Modal(document.getElementById('deleteModal')).show();
}

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
  if (!portfolioToDelete) return;
  try {
    const res = await fetch(`${API_BASE}/portfolio/${portfolioToDelete}`, {
      method: 'DELETE', headers: Auth.apiHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
    loadPortfolios();
  } catch (err) {
    alert('Failed to delete: ' + err.message);
  }
});

// Share Modal
function openShareModal(shareId, name) {
  const url = `${window.location.origin}/portfolio.html?id=${shareId}`;
  document.getElementById('shareUrl').value = url;
  document.getElementById('shareTwitter').href = `https://twitter.com/intent/tweet?text=Check%20out%20my%20portfolio!&url=${encodeURIComponent(url)}`;
  document.getElementById('shareLinkedIn').href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  document.getElementById('shareWhatsApp').href = `https://wa.me/?text=${encodeURIComponent('Check out my portfolio! ' + url)}`;
  new bootstrap.Modal(document.getElementById('shareModal')).show();
}

function copyShareLink() {
  const url = document.getElementById('shareUrl').value;
  navigator.clipboard.writeText(url);
  const btn = event.target.closest('button');
  btn.innerHTML = '<i class="bi bi-check me-1"></i>Copied!';
  setTimeout(() => btn.innerHTML = '<i class="bi bi-copy me-1"></i>Copy', 2000);
}

// Sidebar toggle
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('d-block');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('d-block');
}

window.generatePortfolio = generatePortfolio;
window.clearFile = clearFile;
window.filterPortfolios = filterPortfolios;
window.sortPortfolios = sortPortfolios;
window.openDeleteModal = openDeleteModal;
window.openShareModal = openShareModal;
window.copyShareLink = copyShareLink;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
