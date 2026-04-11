/* editor.js - Live Portfolio Editor */

// State
let state = {
  portfolioId: null,
  skills: [],
  projects: [],
  experience: [],
  education: [],
  currentTheme: 'flatly',
  currentTemplate: 'classic',
  profileImageUrl: '',
  isDirty: false,
};

// Bootswatch themes
const THEMES = [
  { name: 'flatly',     label: 'Flatly',     color: '#18bc9c', dark: false },
  { name: 'darkly',     label: 'Darkly',     color: '#375a7f', dark: true  },
  { name: 'cyborg',     label: 'Cyborg',     color: '#2a9fd6', dark: true  },
  { name: 'lux',        label: 'Lux',        color: '#1a1a1a', dark: false },
  { name: 'pulse',      label: 'Pulse',      color: '#593196', dark: false },
  { name: 'morph',      label: 'Morph',      color: '#378dfc', dark: false },
  { name: 'vapor',      label: 'Vapor',      color: '#6f42c1', dark: true  },
  { name: 'quartz',     label: 'Quartz',     color: '#6ea8fe', dark: false },
  { name: 'superhero',  label: 'Superhero',  color: '#df6919', dark: true  },
  { name: 'sketchy',    label: 'Sketchy',    color: '#333',    dark: false },
  { name: 'cosmo',      label: 'Cosmo',      color: '#2780e3', dark: false },
  { name: 'united',     label: 'United',     color: '#e95420', dark: false },
  { name: 'slate',      label: 'Slate',      color: '#3a3f44', dark: true  },
  { name: 'solar',      label: 'Solar',      color: '#b58900', dark: true  },
  { name: 'minty',      label: 'Minty',      color: '#78c2ad', dark: false },
];

const SUGGESTED_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js',
  'Python', 'Django', 'Flask', 'Java', 'Spring Boot', 'PHP',
  'HTML', 'CSS', 'Bootstrap', 'Tailwind CSS', 'SQL', 'MongoDB',
  'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS',
  'Git', 'GitHub', 'CI/CD', 'REST API', 'GraphQL', 'TypeScript',
  'React Native', 'Flutter', 'Machine Learning', 'TensorFlow', 'Figma',
];

// Init
document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth();
  const params = new URLSearchParams(window.location.search);
  const portfolioId = params.get('id');
  const isNew = params.get('new') === 'true';
  const fromResume = params.get('fromResume') === 'true';

  buildThemeSelector();
  buildSuggestedSkills();
  initSkillsInput();
  initResizeHandle();
  initAutoSave();

  if (portfolioId) {
    state.portfolioId = portfolioId;
    loadPortfolio(portfolioId);
  } else if (isNew && fromResume) {
    const parsedData = sessionStorage.getItem('parsed_resume');
    if (parsedData) {
      fillFromParsed(JSON.parse(parsedData));
      sessionStorage.removeItem('parsed_resume');
    }
    updatePreview();
  } else {
    // New empty portfolio
    addProject();
    addExperience();
    updatePreview();
  }
});

// ===== LOAD PORTFOLIO =====
async function loadPortfolio(id) {
  try {
    const res = await fetch(`${API_BASE}/portfolio/${id}`, { headers: Auth.apiHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    const p = data.portfolio;
    fillFromData(p);
  } catch (err) {
    alert('Failed to load portfolio: ' + err.message);
  }
}

function fillFromData(p) {
  document.getElementById('portfolioTitleInput').value = p.name || 'My Portfolio';
  document.getElementById('f_name').value = p.name || '';
  document.getElementById('f_title').value = p.title || '';
  document.getElementById('f_email').value = p.email || '';
  document.getElementById('f_phone').value = p.phone || '';
  document.getElementById('f_location').value = p.location || '';
  document.getElementById('f_github').value = p.github || '';
  document.getElementById('f_linkedin').value = p.linkedin || '';
  document.getElementById('f_about').value = p.about || '';
  document.getElementById('f_ghUsername').value = '';

  if (p.profileImage) {
    state.profileImageUrl = p.profileImage;
    const preview = document.getElementById('profileImgPreview');
    preview.innerHTML = `<img src="http://localhost:5000${p.profileImage}" style="width:100%;height:100%;object-fit:cover;"/>`;
  }

  state.skills = p.skills || [];
  renderSkillTags();

  state.projects = p.projects || [];
  renderProjects();

  state.experience = p.experience || [];
  renderExperience();

  state.education = p.education || [];
  renderEducation();

  state.currentTheme = p.theme || 'flatly';
  selectTheme(state.currentTheme, false);

  state.currentTemplate = p.templateId || 'classic';
  document.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
  document.querySelector(`[onclick*="${state.currentTemplate}"]`)?.classList.add('active');

  document.getElementById('isPublicToggle').checked = p.isPublic !== false;
  updatePreview();
}

function fillFromParsed(data) {
  document.getElementById('f_name').value = data.name || '';
  document.getElementById('portfolioTitleInput').value = (data.name || 'My') + "'s Portfolio";
  document.getElementById('f_title').value = data.title || '';
  document.getElementById('f_email').value = data.email || '';
  document.getElementById('f_phone').value = data.phone || '';
  document.getElementById('f_github').value = data.github || '';
  document.getElementById('f_linkedin').value = data.linkedin || '';
  document.getElementById('f_about').value = data.about || '';
  state.skills = data.skills || [];
  renderSkillTags();
  state.projects = (data.projects || []).map(p => ({ ...p, id: Date.now() + Math.random() }));
  renderProjects();
  state.experience = (data.experience || []).map(e => ({ ...e, id: Date.now() + Math.random() }));
  renderExperience();
  state.education = (data.education || []).map(e => ({ ...e, id: Date.now() + Math.random() }));
  renderEducation();
}

// ===== THEME SYSTEM =====
function buildThemeSelector() {
  const grid = document.getElementById('themeSelectorGrid');
  grid.innerHTML = THEMES.map(t => `
    <div class="theme-option ${t.name === state.currentTheme ? 'selected' : ''}"
         onclick="selectTheme('${t.name}', true)" id="theme-opt-${t.name}" title="${t.label}">
      <div class="theme-option-preview" style="background:${t.color}">
        <div class="bar"></div>
        <div class="line"></div>
        <div class="line" style="width:70%"></div>
      </div>
      <div class="theme-option-label">${t.label}</div>
    </div>
  `).join('');
}

function selectTheme(themeName, updatePrev = true) {
  state.currentTheme = themeName;
  document.querySelectorAll('.theme-option').forEach(el => el.classList.remove('selected'));
  document.getElementById('theme-opt-' + themeName)?.classList.add('selected');
  if (updatePrev) updatePreview();
  markDirty();
}

// ===== TEMPLATE =====
function selectTemplate(templateId, el) {
  state.currentTemplate = templateId;
  document.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  updatePreview();
  markDirty();
}

// ===== SKILLS =====
function buildSuggestedSkills() {
  const container = document.getElementById('suggestedSkills');
  container.innerHTML = SUGGESTED_SKILLS.map(s => `
    <span class="suggested-skill" onclick="addSkillFromSuggestion('${s}')">${s}</span>
  `).join('');
}

function initSkillsInput() {
  const input = document.getElementById('skillInput');
  const area = document.getElementById('skillsInputArea');

  area.addEventListener('click', () => input.focus());

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = input.value.trim().replace(/,$/, '');
      if (val) addSkill(val);
      input.value = '';
    } else if (e.key === 'Backspace' && !input.value && state.skills.length > 0) {
      state.skills.pop();
      renderSkillTags();
      updatePreview();
    }
  });
}

function addSkill(skill) {
  if (!skill || state.skills.includes(skill)) return;
  state.skills.push(skill);
  renderSkillTags();
  updatePreview();
  markDirty();
}

function addSkillFromSuggestion(skill) {
  addSkill(skill);
}

function removeSkill(skill) {
  state.skills = state.skills.filter(s => s !== skill);
  renderSkillTags();
  updatePreview();
  markDirty();
}

function renderSkillTags() {
  const container = document.getElementById('skillsTags');
  container.innerHTML = state.skills.map(s => `
    <span class="skill-tag">
      ${s}
      <span class="skill-tag-remove" onclick="removeSkill('${s}')">&times;</span>
    </span>
  `).join('');
}

// ===== PROJECTS =====
function addProject(data = {}) {
  const id = Date.now() + Math.random();
  state.projects.push({ id, title: data.title || '', description: data.description || '', link: data.link || '', github: data.github || '', tech: data.tech || '' });
  renderProjects();
  markDirty();
}

function removeProject(id) {
  state.projects = state.projects.filter(p => p.id !== id);
  renderProjects();
  updatePreview();
  markDirty();
}

function renderProjects() {
  const list = document.getElementById('projectsList');
  list.innerHTML = state.projects.map((p, i) => `
    <div class="dynamic-card" id="proj-${p.id}">
      <div class="dynamic-card-header" onclick="toggleCard('proj-body-${p.id}')">
        <h6><i class="bi bi-folder-fill me-2 text-primary"></i>Project ${i + 1}: ${p.title || 'Untitled'}</h6>
        <div class="d-flex gap-2">
          <button class="btn btn-link p-0 text-danger" onclick="event.stopPropagation();removeProject(${p.id})"><i class="bi bi-trash"></i></button>
          <i class="bi bi-chevron-down text-muted"></i>
        </div>
      </div>
      <div class="dynamic-card-body" id="proj-body-${p.id}">
        <input type="text" placeholder="Project title *" value="${p.title}" oninput="updateProject(${p.id},'title',this.value)"/>
        <textarea placeholder="Description" rows="2" oninput="updateProject(${p.id},'description',this.value)">${p.description}</textarea>
        <input type="text" placeholder="Live URL (https://...)" value="${p.link}" oninput="updateProject(${p.id},'link',this.value)"/>
        <input type="text" placeholder="GitHub URL" value="${p.github}" oninput="updateProject(${p.id},'github',this.value)"/>
        <input type="text" placeholder="Tech stack (React, Node, etc)" value="${p.tech}" oninput="updateProject(${p.id},'tech',this.value)"/>
      </div>
    </div>
  `).join('') || '<p class="text-muted small text-center py-3">No projects added yet</p>';
}

function updateProject(id, field, value) {
  const proj = state.projects.find(p => p.id === id);
  if (proj) { proj[field] = value; markDirty(); updatePreview(); }
  // Update card title
  if (field === 'title') {
    const header = document.querySelector(`#proj-${id} h6`);
    if (header) header.innerHTML = `<i class="bi bi-folder-fill me-2 text-primary"></i>Project: ${value || 'Untitled'}`;
  }
}

// ===== EXPERIENCE =====
function addExperience(data = {}) {
  const id = Date.now() + Math.random();
  state.experience.push({ id, role: data.role || '', company: data.company || '', duration: data.duration || '', description: data.description || '' });
  renderExperience();
  markDirty();
}

function removeExperience(id) {
  state.experience = state.experience.filter(e => e.id !== id);
  renderExperience();
  updatePreview();
  markDirty();
}

function renderExperience() {
  const list = document.getElementById('experienceList');
  list.innerHTML = state.experience.map((e, i) => `
    <div class="dynamic-card">
      <div class="dynamic-card-header" onclick="toggleCard('exp-body-${e.id}')">
        <h6><i class="bi bi-briefcase-fill me-2 text-success"></i>${e.role || 'Role'} @ ${e.company || 'Company'}</h6>
        <div class="d-flex gap-2">
          <button class="btn btn-link p-0 text-danger" onclick="event.stopPropagation();removeExperience(${e.id})"><i class="bi bi-trash"></i></button>
          <i class="bi bi-chevron-down text-muted"></i>
        </div>
      </div>
      <div class="dynamic-card-body" id="exp-body-${e.id}">
        <input type="text" placeholder="Job title *" value="${e.role}" oninput="updateExperience(${e.id},'role',this.value)"/>
        <input type="text" placeholder="Company *" value="${e.company}" oninput="updateExperience(${e.id},'company',this.value)"/>
        <input type="text" placeholder="Duration (e.g. Jan 2022 - Present)" value="${e.duration}" oninput="updateExperience(${e.id},'duration',this.value)"/>
        <textarea placeholder="Description / Achievements" rows="3" oninput="updateExperience(${e.id},'description',this.value)">${e.description}</textarea>
      </div>
    </div>
  `).join('') || '<p class="text-muted small text-center py-3">No experience added yet</p>';
}

function updateExperience(id, field, value) {
  const exp = state.experience.find(e => e.id === id);
  if (exp) { exp[field] = value; markDirty(); updatePreview(); }
}

// ===== EDUCATION =====
function addEducation(data = {}) {
  const id = Date.now() + Math.random();
  state.education.push({ id, degree: data.degree || '', institution: data.institution || '', year: data.year || '' });
  renderEducation();
  markDirty();
}

function removeEducation(id) {
  state.education = state.education.filter(e => e.id !== id);
  renderEducation();
  updatePreview();
  markDirty();
}

function renderEducation() {
  const list = document.getElementById('educationList');
  list.innerHTML = state.education.map(e => `
    <div class="dynamic-card">
      <div class="dynamic-card-header" onclick="toggleCard('edu-body-${e.id}')">
        <h6><i class="bi bi-mortarboard-fill me-2 text-warning"></i>${e.degree || 'Degree'}</h6>
        <div class="d-flex gap-2">
          <button class="btn btn-link p-0 text-danger" onclick="event.stopPropagation();removeEducation(${e.id})"><i class="bi bi-trash"></i></button>
          <i class="bi bi-chevron-down text-muted"></i>
        </div>
      </div>
      <div class="dynamic-card-body" id="edu-body-${e.id}">
        <input type="text" placeholder="Degree / Certificate *" value="${e.degree}" oninput="updateEducation(${e.id},'degree',this.value)"/>
        <input type="text" placeholder="Institution / University" value="${e.institution}" oninput="updateEducation(${e.id},'institution',this.value)"/>
        <input type="text" placeholder="Year (e.g. 2020 - 2024)" value="${e.year}" oninput="updateEducation(${e.id},'year',this.value)"/>
      </div>
    </div>
  `).join('') || '<p class="text-muted small text-center py-3">No education added yet</p>';
}

function updateEducation(id, field, value) {
  const edu = state.education.find(e => e.id === id);
  if (edu) { edu[field] = value; markDirty(); updatePreview(); }
}

// Toggle card expansion
function toggleCard(bodyId) {
  const body = document.getElementById(bodyId);
  if (body) body.style.display = body.style.display === 'none' ? 'block' : 'none';
}

// ===== PROFILE IMAGE =====
async function handleProfileImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Preview locally first
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('profileImgPreview');
    preview.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;"/>`;
    state.profileImageUrl = e.target.result; // Use base64 for preview
    updatePreview();
  };
  reader.readAsDataURL(file);

  // Upload to server
  try {
    const formData = new FormData();
    formData.append('profileImage', file);
    const res = await fetch(`${API_BASE}/upload/profile`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${Auth.getToken()}` },
      body: formData,
    });
    const data = await res.json();
    if (data.success) {
      state.profileImageUrl = `http://localhost:5000${data.imageUrl}`;
      markDirty();
    }
  } catch (err) {
    console.error('Profile image upload failed:', err);
  }
}

// ===== GITHUB IMPORT =====
async function importGitHubRepos() {
  const username = document.getElementById('f_ghUsername').value.trim();
  if (!username) { alert('Enter a GitHub username first'); return; }

  document.getElementById('f_github').value = `https://github.com/${username}`;

  try {
    const res = await fetch(`https://api.github.com/users/${username}/repos?sort=stars&per_page=6`);
    if (!res.ok) throw new Error('GitHub user not found');
    const repos = await res.json();
    const newProjects = repos.map(r => ({
      id: Date.now() + Math.random(),
      title: r.name,
      description: r.description || '',
      link: r.homepage || '',
      github: r.html_url,
      tech: r.language || '',
    }));

    // Replace or append
    if (state.projects.length === 0 || confirm('Replace existing projects with GitHub repos?')) {
      state.projects = newProjects;
    } else {
      state.projects = [...state.projects, ...newProjects];
    }
    renderProjects();
    updatePreview();
    markDirty();
    alert(`✅ Imported ${repos.length} repos from GitHub!`);
  } catch (err) {
    alert('Failed to import: ' + err.message);
  }
}

// ===== LIVE PREVIEW =====
let previewDebounce = null;

function updatePreview() {
  clearTimeout(previewDebounce);
  previewDebounce = setTimeout(() => renderPreview(), 80);
}

function getFormData() {
  return {
    name: document.getElementById('f_name')?.value || '',
    title: document.getElementById('f_title')?.value || '',
    email: document.getElementById('f_email')?.value || '',
    phone: document.getElementById('f_phone')?.value || '',
    location: document.getElementById('f_location')?.value || '',
    github: document.getElementById('f_github')?.value || '',
    linkedin: document.getElementById('f_linkedin')?.value || '',
    about: document.getElementById('f_about')?.value || '',
    skills: state.skills,
    projects: state.projects,
    experience: state.experience,
    education: state.education,
    theme: state.currentTheme,
    profileImage: state.profileImageUrl,
    isPublic: document.getElementById('isPublicToggle')?.checked !== false,
    templateId: state.currentTemplate,
  };
}

function renderPreview() {
  const data = getFormData();
  const html = generatePreviewHTML(data);
  const frame = document.getElementById('previewFrame');
  const doc = frame.contentDocument || frame.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
}

function generatePreviewHTML(p) {
  const themeCSS = `https://cdn.jsdelivr.net/npm/bootswatch@5.3.2/dist/${p.theme}/bootstrap.min.css`;

  // Skills HTML
  const skillsHTML = p.skills.map(s =>
    `<span style="display:inline-flex;align-items:center;padding:4px 12px;border-radius:20px;margin:3px;font-size:0.82rem;font-weight:500;background:var(--bs-primary);color:white">${s}</span>`
  ).join('');

  // Projects HTML
  const projectsHTML = p.projects.filter(pr => pr.title).map(pr => `
    <div style="background:var(--bs-body-bg);border:1px solid var(--bs-border-color);border-radius:10px;padding:20px;break-inside:avoid;transition:transform 0.2s;">
      <h6 style="font-weight:700;margin-bottom:6px">${pr.title}</h6>
      ${pr.tech ? `<small style="color:var(--bs-secondary-color);display:block;margin-bottom:8px"><span style="background:var(--bs-secondary-bg);padding:2px 8px;border-radius:4px;">${pr.tech}</span></small>` : ''}
      <p style="font-size:0.85rem;color:var(--bs-secondary-color);margin-bottom:10px">${pr.description}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${pr.link ? `<a href="${pr.link}" style="font-size:0.78rem;color:var(--bs-primary)" target="_blank">🌐 Live Demo</a>` : ''}
        ${pr.github ? `<a href="${pr.github}" style="font-size:0.78rem;color:var(--bs-secondary-color)" target="_blank">⭐ GitHub</a>` : ''}
      </div>
    </div>`).join('');

  // Experience HTML
  const expHTML = p.experience.filter(e => e.role).map((e, i) => `
    <div style="display:flex;gap:16px;margin-bottom:24px">
      <div style="display:flex;flex-direction:column;align-items:center">
        <div style="width:40px;height:40px;border-radius:50%;background:var(--bs-primary);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;flex-shrink:0">${i + 1}</div>
        ${i < p.experience.filter(e => e.role).length - 1 ? `<div style="width:2px;flex:1;background:var(--bs-border-color);margin-top:4px;min-height:20px"></div>` : ''}
      </div>
      <div style="padding-top:6px">
        <h6 style="font-weight:700;margin-bottom:2px">${e.role}</h6>
        <p style="color:var(--bs-secondary-color);font-size:0.85rem;margin-bottom:4px">${e.company}${e.duration ? ` &bull; ${e.duration}` : ''}</p>
        ${e.description ? `<p style="font-size:0.82rem;color:var(--bs-secondary-color)">${e.description}</p>` : ''}
      </div>
    </div>`).join('');

  // Education HTML
  const eduHTML = p.education.filter(e => e.degree).map(e => `
    <div style="display:flex;gap:12px;margin-bottom:16px;background:var(--bs-secondary-bg);border-radius:10px;padding:14px">
      <div style="font-size:1.5rem">🎓</div>
      <div>
        <h6 style="font-weight:700;margin-bottom:2px">${e.degree}</h6>
        <p style="color:var(--bs-secondary-color);font-size:0.85rem;margin-bottom:0">${e.institution}${e.year ? ` &bull; ${e.year}` : ''}</p>
      </div>
    </div>`).join('');

  // Social Links
  const socialHTML = [
    p.email ? `<a href="mailto:${p.email}" style="color:var(--bs-body-color);text-decoration:none;font-size:0.85rem">📧 ${p.email}</a>` : '',
    p.phone ? `<span style="font-size:0.85rem">📞 ${p.phone}</span>` : '',
    p.location ? `<span style="font-size:0.85rem">📍 ${p.location}</span>` : '',
    p.github ? `<a href="${p.github}" style="color:var(--bs-body-color);text-decoration:none;font-size:0.85rem" target="_blank">⭐ GitHub</a>` : '',
    p.linkedin ? `<a href="${p.linkedin}" style="color:var(--bs-body-color);text-decoration:none;font-size:0.85rem" target="_blank">💼 LinkedIn</a>` : '',
  ].filter(Boolean).join('<span style="color:var(--bs-border-color);margin:0 8px">|</span>');

  const avatarHTML = p.profileImage
    ? `<img src="${p.profileImage}" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:4px solid var(--bs-border-color)" />`
    : `<div style="width:120px;height:120px;border-radius:50%;background:linear-gradient(135deg,#4f46e5,#7c3aed);display:flex;align-items:center;justify-content:center;font-size:3rem;color:white;border:4px solid var(--bs-border-color)">👤</div>`;

  // Template-specific layout
  const isClassic = p.templateId !== 'sidebar';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="stylesheet" href="${themeCSS}">
  <style>
    body { font-family: 'Segoe UI', Inter, sans-serif; font-size: 14px; }
    * { box-sizing: border-box; }
    .section-line { border: none; height: 2px; background: linear-gradient(90deg, var(--bs-primary), transparent); margin: 8px 0 20px; border-radius: 2px; }
    .project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
  </style>
</head>
<body>
  <!-- NAVBAR -->
  <nav class="navbar navbar-expand-lg" style="padding:12px 20px;border-bottom:1px solid var(--bs-border-color)">
    <span class="navbar-brand fw-bold">${p.name || 'Portfolio'}</span>
    <div class="d-flex gap-3 ms-auto flex-wrap">
      ${p.email ? `<a href="mailto:${p.email}" class="btn btn-sm btn-primary">Contact</a>` : ''}
    </div>
  </nav>

  <!-- HERO -->
  <section style="padding:40px 20px;background:var(--bs-secondary-bg);text-align:center">
    <div style="margin-bottom:16px">${avatarHTML}</div>
    <h1 style="font-size:2rem;font-weight:800;margin-bottom:6px">${p.name || 'Your Name'}</h1>
    <p style="color:var(--bs-secondary-color);font-size:1rem;margin-bottom:16px">${p.title || 'Your Job Title'}</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">${socialHTML}</div>
  </section>

  <div style="padding:24px 20px;max-width:960px;margin:0 auto">
    ${p.about ? `<section style="margin-bottom:28px">
      <h5 style="font-weight:700;margin-bottom:4px">About Me</h5>
      <div class="section-line"></div>
      <p style="color:var(--bs-secondary-color);line-height:1.7">${p.about}</p>
    </section>` : ''}

    ${p.skills.length ? `<section style="margin-bottom:28px">
      <h5 style="font-weight:700;margin-bottom:4px">Skills</h5>
      <div class="section-line"></div>
      <div>${skillsHTML}</div>
    </section>` : ''}

    ${p.projects.filter(pr => pr.title).length ? `<section style="margin-bottom:28px">
      <h5 style="font-weight:700;margin-bottom:4px">Projects</h5>
      <div class="section-line"></div>
      <div class="project-grid">${projectsHTML}</div>
    </section>` : ''}

    ${p.experience.filter(e => e.role).length ? `<section style="margin-bottom:28px">
      <h5 style="font-weight:700;margin-bottom:4px">Experience</h5>
      <div class="section-line"></div>
      ${expHTML}
    </section>` : ''}

    ${p.education.filter(e => e.degree).length ? `<section style="margin-bottom:28px">
      <h5 style="font-weight:700;margin-bottom:4px">Education</h5>
      <div class="section-line"></div>
      ${eduHTML}
    </section>` : ''}
  </div>

  <footer style="text-align:center;padding:20px;border-top:1px solid var(--bs-border-color);color:var(--bs-secondary-color);font-size:0.8rem">
    Made with ResumeCraft ✨
  </footer>
</body>
</html>`;
}

// ===== SAVE PORTFOLIO =====
async function savePortfolio() {
  const data = getFormData();
  const portfolioName = document.getElementById('portfolioTitleInput').value || data.name || 'My Portfolio';
  const payload = {
    ...data,
    name: portfolioName,
    skills: state.skills,
    projects: state.projects.map(({ id, ...rest }) => rest),
    experience: state.experience.map(({ id, ...rest }) => rest),
    education: state.education.map(({ id, ...rest }) => rest),
    profileImage: state.profileImageUrl?.startsWith('data:') ? '' : (state.profileImageUrl?.replace('http://localhost:5000', '') || ''),
  };

  const saveStatus = document.getElementById('saveStatus');
  saveStatus.innerHTML = '<span class="text-warning"><i class="bi bi-clock me-1"></i>Saving...</span>';

  try {
    let res, responseData;
    if (state.portfolioId) {
      // Update existing
      res = await fetch(`${API_BASE}/portfolio/${state.portfolioId}`, {
        method: 'PUT',
        headers: Auth.apiHeaders(),
        body: JSON.stringify(payload),
      });
    } else {
      // Create new
      res = await fetch(`${API_BASE}/portfolio`, {
        method: 'POST',
        headers: Auth.apiHeaders(),
        body: JSON.stringify(payload),
      });
    }
    responseData = await res.json();
    if (!responseData.success) throw new Error(responseData.message);

    if (!state.portfolioId) state.portfolioId = responseData.portfolio._id;
    state.isDirty = false;

    saveStatus.innerHTML = '<span class="text-success"><i class="bi bi-check-circle me-1"></i>Saved!</span>';
    setTimeout(() => saveStatus.innerHTML = '<i class="bi bi-circle me-1"></i>All saved', 2000);

    // Show share link
    if (responseData.portfolio?.shareId) {
      const shareId = responseData.portfolio.shareId;
      showShareLink(shareId);
    }
  } catch (err) {
    saveStatus.innerHTML = '<span class="text-danger"><i class="bi bi-x-circle me-1"></i>Error</span>';
    alert('Save failed: ' + err.message);
  }
}

function showShareLink(shareId) {
  const url = `${window.location.origin}/portfolio.html?id=${shareId}`;
  if (confirm(`✅ Portfolio saved!\n\nShare link:\n${url}\n\nCopy to clipboard?`)) {
    navigator.clipboard.writeText(url);
  }
}

// ===== DOWNLOAD HTML =====
async function downloadPortfolioHTML() {
  if (!state.portfolioId) {
    alert('Save your portfolio first before downloading');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/portfolio/${state.portfolioId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${Auth.getToken()}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${state.portfolioName || 'portfolio'}_resume.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    alert('Failed to download portfolio. Please try again.');
  }
}

// ===== FULLSCREEN PREVIEW =====
function previewFullscreen() {
  const data = getFormData();
  const html = generatePreviewHTML(data);
  const frame = document.getElementById('fullscreenFrame');
  const doc = frame.contentDocument || frame.contentWindow.document;
  doc.open(); doc.write(html); doc.close();
  new bootstrap.Modal(document.getElementById('fullscreenModal')).show();
}

// ===== PREVIEW SIZE =====
function setPreviewSize(size, btn) {
  document.querySelectorAll('.px-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const frame = document.getElementById('previewFrame');
  const wrapper = document.getElementById('previewFrameWrapper');
  const sizes = { desktop: '100%', tablet: '768px', mobile: '375px' };
  frame.style.width = sizes[size];
  wrapper.style.justifyContent = size === 'desktop' ? 'stretch' : 'center';
}

// ===== PANEL TABS =====
function switchPanelTab(tab, btn) {
  document.querySelectorAll('.panel-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.panel-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  btn.classList.add('active');
}

// ===== AUTO SAVE =====
function initAutoSave() {
  setInterval(() => {
    if (state.isDirty && state.portfolioId) {
      savePortfolio();
    }
  }, 30000); // Auto save every 30s
}

function markDirty() {
  state.isDirty = true;
  document.getElementById('saveStatus').innerHTML = '<i class="bi bi-circle me-1 text-warning"></i>Unsaved changes';
}

// ===== RESIZE HANDLE =====
function initResizeHandle() {
  const handle = document.getElementById('resizeHandle');
  const panel = document.getElementById('editorPanel');
  if (!handle || !panel) return;
  let isResizing = false, startX, startWidth;

  handle.addEventListener('mousedown', (e) => {
    isResizing = true; startX = e.clientX; startWidth = panel.offsetWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const width = Math.min(Math.max(startWidth + (e.clientX - startX), 280), 650);
    panel.style.width = width + 'px';
  });
  document.addEventListener('mouseup', () => {
    isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });
}

// Add input event listeners to basic form fields
document.addEventListener('DOMContentLoaded', () => {
  ['f_name', 'f_title', 'f_email', 'f_phone', 'f_location', 'f_github', 'f_linkedin', 'f_about'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => { markDirty(); updatePreview(); });
  });
  document.getElementById('isPublicToggle')?.addEventListener('change', () => { markDirty(); updatePreview(); });
});

// Expose to global
window.updatePreview = updatePreview;
window.switchPanelTab = switchPanelTab;
window.selectTheme = selectTheme;
window.selectTemplate = selectTemplate;
window.addProject = addProject;
window.removeProject = removeProject;
window.updateProject = updateProject;
window.addExperience = addExperience;
window.removeExperience = removeExperience;
window.updateExperience = updateExperience;
window.addEducation = addEducation;
window.removeEducation = removeEducation;
window.updateEducation = updateEducation;
window.addSkillFromSuggestion = addSkillFromSuggestion;
window.removeSkill = removeSkill;
window.toggleCard = toggleCard;
window.handleProfileImage = handleProfileImage;
window.importGitHubRepos = importGitHubRepos;
window.savePortfolio = savePortfolio;
window.downloadPortfolioHTML = downloadPortfolioHTML;
window.previewFullscreen = previewFullscreen;
window.setPreviewSize = setPreviewSize;
