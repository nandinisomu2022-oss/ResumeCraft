const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

// Extract text from PDF or DOCX
const extractText = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } else if (ext === '.docx' || ext === '.doc') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  throw new Error('Unsupported file type');
};

// Parse name (usually first non-empty line)
const extractName = (text) => {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 1);
  for (const line of lines.slice(0, 5)) {
    // Likely a name: 2-4 words, all caps or title case, no special chars
    if (/^[A-Za-z\s]{4,40}$/.test(line) && line.split(' ').length <= 4) {
      return line;
    }
  }
  return lines[0] || '';
};

// Extract email
const extractEmail = (text) => {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : '';
};

// Extract phone
const extractPhone = (text) => {
  const match = text.match(/(\+?\d[\d\s\-().]{8,15}\d)/);
  return match ? match[0].trim() : '';
};

// Extract LinkedIn
const extractLinkedIn = (text) => {
  const match = text.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/i);
  return match ? `https://linkedin.com/in/${match[1]}` : '';
};

// Extract GitHub
const extractGitHub = (text) => {
  const match = text.match(/github\.com\/([a-zA-Z0-9-]+)/i);
  return match ? `https://github.com/${match[1]}` : '';
};

// Extract skills
const extractSkills = (text) => {
  const skillKeywords = [
    'JavaScript','TypeScript','Python','Java','C++','C#','Ruby','PHP','Go','Rust','Swift','Kotlin',
    'React','Angular','Vue','Node.js','Express','Django','Flask','Spring','Laravel','Rails',
    'HTML','CSS','SASS','Bootstrap','Tailwind',
    'MongoDB','PostgreSQL','MySQL','Redis','Firebase','SQLite',
    'AWS','Azure','GCP','Docker','Kubernetes','Terraform','CI/CD',
    'Git','GitHub','GitLab','Linux','REST API','GraphQL',
    'Machine Learning','Deep Learning','TensorFlow','PyTorch','NLP',
    'Agile','Scrum','Jira','Figma','Photoshop','Adobe XD',
  ];
  const found = skillKeywords.filter(skill =>
    new RegExp(`\\b${skill.replace('+', '\\+')}\\b`, 'i').test(text)
  );
  return [...new Set(found)];
};

// Extract section by heading
const extractSection = (text, headings) => {
  const lines = text.split('\n');
  let inSection = false;
  const sectionLines = [];
  const headingRegex = new RegExp(`^(${headings.join('|')})`, 'i');
  const nextSectionRegex = /^(education|experience|projects|skills|certifications|awards|languages|references|summary|objective|work history)/i;

  for (const line of lines) {
    if (headingRegex.test(line.trim())) { inSection = true; continue; }
    if (inSection) {
      if (nextSectionRegex.test(line.trim()) && !headingRegex.test(line.trim())) break;
      sectionLines.push(line);
    }
  }
  return sectionLines.join('\n').trim();
};

// Parse experience blocks
const extractExperience = (text) => {
  const section = extractSection(text, ['experience', 'work experience', 'employment', 'work history']);
  if (!section) return [];
  const blocks = section.split(/\n{2,}/);
  return blocks.slice(0, 5).map(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    return {
      role: lines[0] || '',
      company: lines[1] || '',
      duration: lines[2] || '',
      description: lines.slice(3).join(' ') || '',
    };
  }).filter(e => e.role);
};

// Parse education blocks
const extractEducation = (text) => {
  const section = extractSection(text, ['education', 'academic background', 'qualifications']);
  if (!section) return [];
  const blocks = section.split(/\n{2,}/);
  return blocks.slice(0, 4).map(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    return {
      degree: lines[0] || '',
      institution: lines[1] || '',
      year: lines[2] || '',
    };
  }).filter(e => e.degree);
};

// Parse projects blocks
const extractProjects = (text) => {
  const section = extractSection(text, ['projects', 'personal projects', 'key projects']);
  if (!section) return [];
  const blocks = section.split(/\n{2,}/);
  return blocks.slice(0, 6).map(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    const linkMatch = block.match(/https?:\/\/[^\s]+/);
    return {
      title: lines[0] || '',
      description: lines.slice(1).join(' ') || '',
      link: linkMatch ? linkMatch[0] : '',
      tech: '',
    };
  }).filter(p => p.title);
};

// Extract summary/about
const extractAbout = (text) => {
  const section = extractSection(text, ['summary', 'objective', 'profile', 'about', 'professional summary']);
  return section.split('\n').slice(0, 5).join(' ').trim();
};

// Extract job title
const extractTitle = (text) => {
  const titleKeywords = [
    'Software Engineer', 'Web Developer', 'Frontend Developer', 'Backend Developer',
    'Full Stack Developer', 'Data Scientist', 'Machine Learning Engineer', 'DevOps Engineer',
    'UI/UX Designer', 'Product Manager', 'Business Analyst', 'Cloud Architect',
    'Mobile Developer', 'iOS Developer', 'Android Developer', 'Security Engineer',
    'Database Administrator', 'Systems Engineer', 'QA Engineer', 'Scrum Master',
  ];
  for (const title of titleKeywords) {
    if (new RegExp(`\\b${title}\\b`, 'i').test(text)) return title;
  }
  // Try to find from first few lines
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(1, 6)) {
    if (line.length < 60 && /developer|engineer|designer|analyst|manager|architect/i.test(line)) {
      return line;
    }
  }
  return 'Software Developer';
};

// Main parser
const parseResume = async (filePath) => {
  try {
    const text = await extractText(filePath);
    return {
      name: extractName(text),
      email: extractEmail(text),
      phone: extractPhone(text),
      linkedin: extractLinkedIn(text),
      github: extractGitHub(text),
      title: extractTitle(text),
      about: extractAbout(text),
      skills: extractSkills(text),
      experience: extractExperience(text),
      education: extractEducation(text),
      projects: extractProjects(text),
    };
  } catch (err) {
    console.error('Resume parsing error:', err.message);
    throw new Error('Failed to parse resume: ' + err.message);
  }
};

module.exports = { parseResume };
