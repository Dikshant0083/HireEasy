# HireEasy 🚀

**Discover real-time jobs, internships, and scholarships — matched to your resume.**

## Features

- 🌐 **Real-time jobs** from Remotive + Arbeitnow APIs (auto-refreshed hourly)
- 🏅 **20 curated scholarships** (Fulbright, Gates Cambridge, Rhodes, DAAD, etc.)
- 📄 **CSV upload** — import your own job listings
- 📑 **Resume upload** — PDF/DOCX parsed, skills auto-extracted
- 🧠 **AI Match Score** — TF-IDF scoring against your skills
- 🚀 **Direct Apply** — one-click opens the original job URL
- ⭐ **Save & track** your applications

---

## Project Structure

```
HireEasy/
├── backend/       → Express API (port 5000)
├── frontend/      → React app (port 3000)
└── sample_jobs.csv → CSV template for uploading jobs
```

---

## Quick Start

### 1. Start Backend
```bash
cd backend
npm install      # already done
npm start
# → http://localhost:5000/api/health
```

### 2. Start Frontend (new terminal)
```bash
cd frontend
npm install      # already done
npm start
# → http://localhost:3000
```

---

## CSV Upload Format

Use the included `sample_jobs.csv` as a template. Required columns:

| Column | Required | Example |
|--------|----------|---------|
| title | ✅ | Software Engineer Intern |
| apply_url | ✅ | https://company.com/apply |
| company | | Google |
| description | | Job description text |
| location | | Bangalore / Remote |
| salary | | ₹80,000/month |
| job_type | | full_time / internship |
| type | | job / internship / scholarship |
| tags | | Python,React,ML (comma-separated) |
| is_remote | | true / false |

Upload via Dashboard → "Upload Job CSV"

---

## API Endpoints

```
POST /api/auth/register    → Register + resume upload
POST /api/auth/login       → Login

GET  /api/user/profile     → Get profile (auth)
PATCH /api/user/profile    → Update profile (auth)
POST /api/user/resume      → Re-upload resume (auth)

GET  /api/jobs             → All jobs (filters: type, search, remote, source)
GET  /api/jobs/:id         → Single job + match score
POST /api/jobs/:id/apply   → Record apply (auth)
POST /api/jobs/:id/save    → Toggle save (auth)
POST /api/jobs/upload-csv  → Import CSV (auth)

GET  /api/applications     → User's applications (auth)
```

---

## Tech Stack

- **Backend**: Node.js, Express, Mongoose, JWT, Multer, pdf-parse, natural (TF-IDF)
- **Frontend**: React 18, Redux Toolkit, React Router, Axios, Tailwind CSS
- **DB**: MongoDB Atlas
- **Job APIs**: Remotive (free), Arbeitnow (free) — no API keys needed
