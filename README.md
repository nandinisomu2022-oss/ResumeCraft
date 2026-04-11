# ResumeCraft 🚀

**Turn your resume into a stunning portfolio in seconds.**

A full-stack web application that automatically parses your PDF/DOCX resume, extracts key information, and converts it into a professional portfolio website with live editing and 15+ Bootstrap themes.

---

## ✨ Features

- 📄 **Smart Resume Parser** — Upload PDF/DOCX, auto-extracts name, skills, experience, projects, education
- ✏️ **Live Split Editor** — Edit left panel, see instant live preview on the right
- 🎨 **15+ Bootswatch Themes** — Flatly, Darkly, Cyborg, Lux, Vapor, Quartz & more
- 🔐 **Google OAuth + JWT Auth** — Sign in with Google or email/password
- 🔗 **Shareable Links** — Every portfolio gets a unique public URL
- ⬇️ **Download as HTML** — Export your portfolio as a standalone file
- 💻 **GitHub Integration** — Auto-import your GitHub repositories
- 📊 **View Analytics** — Track how many people view your portfolio
- 📱 **Responsive Design** — Works on desktop, tablet, and mobile

---

## 🏗️ Project Structure

```
ResumeCraft/
├── client/                    # Frontend (HTML/CSS/JS + Bootstrap)
│   ├── index.html             # Landing page
│   ├── login.html             # Login / Register page
│   ├── dashboard.html         # User dashboard
│   ├── editor.html            # Live portfolio editor (MAIN)
│   ├── portfolio.html         # Public portfolio view
│   ├── css/
│   │   └── style.css          # Custom styles
│   └── js/
│       ├── auth.js            # Auth utilities
│       ├── dashboard.js       # Dashboard logic
│       ├── editor.js          # Editor + live preview
│       └── portfolio.js       # Public portfolio view
│
└── server/                    # Backend (Node.js + Express + MongoDB)
    ├── server.js              # Main Express server
    ├── .env                   # Environment variables
    ├── config/
    │   ├── db.js              # MongoDB connection
    │   └── passport.js        # Passport.js (Google + Local)
    ├── models/
    │   ├── User.js            # User schema
    │   └── Portfolio.js       # Portfolio schema
    ├── routes/
    │   ├── auth.js            # POST /api/auth/login, /register, /google
    │   ├── portfolio.js       # CRUD /api/portfolio
    │   └── upload.js          # POST /api/upload/resume, /profile
    ├── middleware/
    │   └── auth.js            # JWT protect middleware
    └── utils/
        └── resumeParser.js    # PDF/DOCX parser
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Google OAuth credentials (optional, for Google login)

### 1. Clone & Install

```bash
cd ResumeCraft/server
npm install
```

### 2. Configure Environment Variables

Edit `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/resumecraft
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

# Google OAuth (get from console.cloud.google.com)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

SESSION_SECRET=your_session_secret
CLIENT_URL=http://localhost:5500
NODE_ENV=development
```

### 3. Start the Backend

```bash
cd server
npm run dev
```

Server runs at: `http://localhost:5000`

### 4. Open the Frontend

Use VS Code Live Server or any static server:

```bash
# Option 1: VS Code Live Server (recommended)
# Right-click client/index.html → Open with Live Server

# Option 2: Python
cd client && python3 -m http.server 5500

# Option 3: npx serve
npx serve client -p 5500
```

Frontend runs at: `http://localhost:5500`

---

## 🔐 Setting up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project → Enable Google+ API
3. Go to Credentials → Create OAuth 2.0 Client ID
4. Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`
5. Copy Client ID and Secret to your `.env` file

---

## 🎨 Bootswatch Themes Available

| Theme | Style | Mode |
|-------|-------|------|
| Flatly | Clean Minimal | Light |
| Darkly | Developer | Dark |
| Cyborg | High-Tech | Dark |
| Lux | Modern Elegant | Light |
| Pulse | Colorful Bold | Light |
| Morph | Soft Modern | Light |
| Vapor | Neon Synthwave | Dark |
| Quartz | Premium Blue | Light |
| Superhero | Bold & Bright | Dark |
| Sketchy | Hand-drawn | Light |
| Cosmo | Clean White | Light |
| United | Orange Energy | Light |
| Slate | Muted Dark | Dark |
| Solar | Warm Dark | Dark |
| Minty | Fresh & Clean | Light |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| GET | `/api/auth/google` | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/upload/resume` | Upload & parse resume |
| POST | `/api/upload/profile` | Upload profile image |
| POST | `/api/portfolio` | Create portfolio |
| GET | `/api/portfolio/my` | Get user's portfolios |
| GET | `/api/portfolio/:id` | Get portfolio by ID |
| PUT | `/api/portfolio/:id` | Update portfolio |
| DELETE | `/api/portfolio/:id` | Delete portfolio |
| GET | `/api/portfolio/share/:shareId` | Get public portfolio |
| GET | `/api/portfolio/:id/download` | Download as HTML |

---

## 🌐 Deployment

### Backend (Render/Railway)
1. Push to GitHub
2. Connect to Render/Railway
3. Set environment variables
4. Deploy!

### Frontend (Vercel/Netlify)
1. Deploy the `/client` folder
2. Update `CLIENT_URL` in backend `.env`
3. Update `API_BASE` in JS files to your backend URL

### Database (MongoDB Atlas)
1. Create a free cluster at [mongodb.com](https://mongodb.com)
2. Get your connection string
3. Replace `MONGODB_URI` in `.env`

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5, Bootswatch
- **Backend**: Node.js, Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT, Passport.js, Google OAuth 2.0
- **File Processing**: Multer, pdf-parse, Mammoth (DOCX)
- **Security**: Helmet, express-rate-limit, bcryptjs

---

## 📝 License

MIT License — free to use and modify.

---

Built with ❤️ using ResumeCraft
# resume
