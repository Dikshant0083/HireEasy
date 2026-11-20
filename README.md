# HireEasy 🚀

**HireEasy is an intelligent, modern job discovery and career management platform.** 
It aggregates real-time jobs, internships, and scholarships from multiple global sources, parses your resume, and ranks every listing by how many of the skills it asks for are on your resume. 

## ✨ Key Features

- 🌐 **Real-Time Job Aggregation**: Fetches live jobs from Remotive, Arbeitnow, JSearch (Indeed/LinkedIn), and Jooble.
- 📄 **Smart Resume Parsing**: Upload your PDF/DOCX resume to extract your skills (dictionary match with word-boundary rules, so Java is not JavaScript and C is not C++).
- 🧠 **Match Score**: The share of a listing's skills that you have, with the matched and missing skills shown on each job. Listings that name no skills get no score instead of a made-up one.
- 🔔 **Email Alerts**: Opt-in to daily automated email alerts that deliver the top 5 matching jobs straight to your inbox.
- 📝 **Resume Builder**: A built-in tool to craft, preview, and export ATS-friendly PDF resumes using custom templates.
- 📅 **Interview & Event Tracker**: Keep track of upcoming interviews, OA links, and application deadlines.
- 📱 **Mobile-First & Fully Responsive**: A clean dark UI built with Tailwind CSS, Lucide icons, and a native app-like bottom navigation for mobile.
- 🔐 **Authentication**: Seamless email/password and Google Sign-In powered by Firebase Auth (ID tokens verified on the API).
- 📂 **CSV Bulk Upload**: Recruiters or users can instantly import large batches of job listings via CSV.

---

## 🛠️ Technology Stack

**Frontend**
- React 18 & React Router DOM
- Redux Toolkit (State Management)
- Tailwind CSS (design tokens in `tailwind.config.js` and `src/index.css`)
- Lucide React (Modern SVGs)
- Firebase Auth (Google Sign-In)
- Axios

**Backend**
- Node.js & Express.js
- MongoDB & Mongoose (Database)
- Node-Cron & Nodemailer (Background jobs & Email alerts)
- pdf-parse & mammoth (resume text), skill matcher in `services/resumeParser.js`, scorer in `services/scorer.js` (`npm test`)
- JWT & bcryptjs (Authentication)
- External APIs: JSearch, Jooble, Remotive, Arbeitnow

---

## 🚀 Quick Start

### 1. Environment Variables

Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development

# Email Alerts
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# External Job APIs
JSEARCH_API_KEY=your_rapidapi_jsearch_key
JOOBLE_API_KEY=your_jooble_api_key

# Frontend URL (For CORS & Email Links)
FRONTEND_URL=http://localhost:3000
```

Create a `.env` file in the `frontend` directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
```

### 2. Start Backend
```bash
cd backend
npm install
npm start
# Server runs on http://localhost:5000
```

### 3. Start Frontend
```bash
cd frontend
npm install
npm start
# Client runs on http://localhost:3000
```

---

## 📂 CSV Upload Format

You can upload custom jobs directly via the Dashboard. Required CSV columns:

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

---

## 🔌 Core API Routes

### Auth & User
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google` - Google Sign-In
- `GET /api/user/profile` - Get user profile
- `POST /api/user/resume` - Upload & parse resume PDF

### Jobs & Applications
- `GET /api/jobs` - Fetch aggregated jobs (with match scores)
- `POST /api/jobs/:id/apply` - Record a job application
- `POST /api/jobs/:id/save` - Bookmark a job
- `POST /api/jobs/upload-csv` - Import bulk jobs

### Alerts & Resume Builder
- `PATCH /api/alerts/preferences` - Toggle email alerts
- `POST /api/alerts/test-email` - Trigger test match email
- `GET /api/resume-builder` - Fetch saved resume drafts
- `PUT /api/resume-builder` - Save resume draft

---
*Built with ❤️ for job seekers.*
