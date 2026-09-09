<p align="center">
  <img src="Naukri Frontend/naukri-frontend/public/logo/naukri_gnb_logo.svg" alt="Naukri Automation Logo" width="200"/>
</p>

<h1 align="center">🚀 Job Application Automation — Full Stack</h1>

<p align="center">
  <strong>Automate your Naukri.com job search, intelligently filter listings, and auto-apply — all powered by AI and real-time browser automation.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19"/>
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Selenium-Stealth-43B02A?logo=selenium&logoColor=white" alt="Selenium"/>
  <img src="https://img.shields.io/badge/Groq_AI-LLaMA_3-FF6B35?logo=meta&logoColor=white" alt="Groq AI"/>
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white" alt="Docker"/>
  <img src="https://img.shields.io/badge/Firebase-Hosting-FFCA28?logo=firebase&logoColor=black" alt="Firebase"/>
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Local Development](#local-development)
  - [Docker Deployment](#docker-deployment)
  - [Production Deployment (Tunnel + Firebase)](#production-deployment-tunnel--firebase)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Job Application Automation** is a full-stack web application that automates the end-to-end process of finding and applying to jobs on [Naukri.com](https://www.naukri.com). It uses **stealth browser automation** (undetected ChromeDriver) to scrape job listings, intelligently filter them by tech-stack match score, and automatically apply — including handling Naukri's multi-step chatbot screening questions using **Groq AI (LLaMA 3)**.

The platform provides a modern React dashboard with **real-time WebSocket logs**, visual analytics, and a complete job pipeline tracker.

---

## ✨ Features

### 🤖 Smart Job Scraping
- **Stealth Scraping** — Uses `undetected-chromedriver` to bypass Cloudflare and anti-bot protections.
- **Configurable Search** — Filter by designation, experience, location, and postal code.
- **Freshness Filter** — Automatically skips jobs older than 1 day.
- **Title Blocklist** — Excludes irrelevant roles (BPO, telecaller, sales, etc.).
- **Tech Match Scoring** — AI-powered skill matching computes a match score between the JD and your tech stack.

### 📝 Automated Job Application
- **One-Click Auto Apply** — Automatically applies to filtered jobs on Naukri.
- **AI-Powered Chatbot Handling** — Uses **Groq AI (LLaMA 3)** to dynamically answer screening questions (CTC, notice period, experience, free-text, dropdowns, radio buttons, checkboxes).
- **Smart Categorization** — Detects and categorizes `EXTERNAL` (company portal redirects) and `WALK-IN` (interview drives) jobs separately.
- **Visual Audit Trail** — Captures debug screenshots of every application attempt.

### 📊 Analytics Dashboard
- Application statistics with **Recharts** (stacked bar charts, donut charts).
- 7-day daily trends broken down by application method.
- Status distribution overview (Applied, Pending, External, Walk-in).

### 📋 Job Pipeline Tracker
- Full pipeline view with status tabs: `ALL`, `PENDING`, `APPLIED`, `FILTERED_OUT`, `EXTERNAL`, `WALK-IN`.
- Color-coded **AI match score badges** (≥75% Green, ≥50% Amber, <50% Red).
- Search and filter across job title, company, and role.
- Responsive: card view on mobile, table view on desktop.

### 🔗 External & Walk-in Manager
- Track company portal redirect jobs (auto-expires after 15 days).
- Track walk-in drive opportunities (auto-expires after 10 days).
- "Mark Applied" toggle and deep-link to company career pages.

### ⚡ Real-Time Automation Controls
- **Live WebSocket Terminal** — Stream automation logs with color-coded events.
- **Pause / Resume / Stop** — Thread-safe controls for running automation tasks.
- **Progress Counters** — Live metrics for jobs scraped and applied.
- **Concurrency Control** — Server-side semaphore limits to 5 simultaneous browser sessions.

### 🔐 Authentication & Security
- **JWT-based authentication** with bcrypt password hashing.
- Protected routes on both frontend and backend.
- User-isolated data access (prevents IDOR vulnerabilities).
- Token persistence via localStorage.

---

## 🛠 Tech Stack

| Layer            | Technology                                                                           |
|------------------|--------------------------------------------------------------------------------------|
| **Frontend**     | React 19, Vite 7, Tailwind CSS v4, Recharts, Lucide Icons, Axios                    |
| **Backend**      | Python, FastAPI, Uvicorn (ASGI), Pydantic                                            |
| **Database**     | PostgreSQL (Supabase) via `psycopg2`                                                 |
| **Automation**   | Selenium, `undetected-chromedriver`, WebDriver Manager, BeautifulSoup4, lxml         |
| **AI**           | Groq Cloud AI (LLaMA 3 `llama3-8b-8192`) for screening question answering           |
| **Auth**         | JWT (`python-jose`), bcrypt (`passlib`)                                              |
| **Real-Time**    | WebSocket (FastAPI/Starlette)                                                        |
| **DevOps**       | Docker, Docker Compose, Cloudflare Tunnel, Firebase Hosting, Nginx                   |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SYSTEM ARCHITECTURE                          │
│                                                                     │
│  ┌────────────────────────┐     ┌────────────────────────────────┐  │
│  │     React 19 SPA       │     │        FastAPI Backend         │  │
│  │  (Firebase / Docker)   │     │     (Local / Docker)           │  │
│  │                        │     │                                │  │
│  │  • Dashboard + Charts  │◄───►│  • REST API (HTTP)             │  │
│  │  • Scraper Controls    │ WS  │  • WebSocket (Live Logs)       │  │
│  │  • Job Pipeline        │◄───►│  • Background Task Threads     │  │
│  │  • Auth Pages          │     │                                │  │
│  └────────────────────────┘     └──────────┬─────────────────────┘  │
│                                            │                        │
│                           ┌────────────────┼────────────────┐       │
│                           │                │                │       │
│                           ▼                ▼                ▼       │
│                  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│                  │  PostgreSQL  │  │  Selenium +   │  │  Groq AI  │  │
│                  │  (Supabase)  │  │  Chrome       │  │ (LLaMA 3) │  │
│                  │              │  │  (Stealth)    │  │           │  │
│                  │  • Users     │  │              │  │  Screening │  │
│                  │  • Jobs      │  │  • Scraping   │  │  Q&A      │  │
│                  │  • Stats     │  │  • Applying   │  │  Engine   │  │
│                  └──────────────┘  └──────────────┘  └───────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
Job-Application-Automation/
│
├── naukri-automation-api/              # 🐍 FastAPI Backend
│   ├── main.py                         # App entry point, routes, JWT auth, WebSocket manager
│   ├── database_setup.py              # PostgreSQL schemas, CRUD, analytics queries
│   ├── scraper_logic.py               # ScraperEngine: stealth scraping, filtering, scoring
│   ├── application_logic.py           # ApplicationEngine: login, auto-apply, AI chatbot
│   ├── chrome_utils.py                # Chrome driver setup, version detection, process cleanup
│   ├── requirements.txt               # Python dependencies
│   ├── Dockerfile                      # Python 3.9 + Google Chrome + matching ChromeDriver
│   ├── Procfile                        # Heroku / Render deployment config
│   └── debug_logs/                     # Screenshot audit trail
│
├── Naukri Frontend/
│   └── naukri-frontend/                # ⚛️ React 19 + Vite 7 Frontend
│       ├── src/
│       │   ├── App.jsx                 # Router, auth, responsive sidebar/header/bottom nav
│       │   ├── config.js              # Dynamic API + WebSocket URL resolution
│       │   ├── LandingPage.jsx        # Marketing hero page with live step simulation
│       │   ├── LoginPage.jsx          # JWT authentication
│       │   ├── RegisterPage.jsx       # User registration
│       │   ├── DashboardPage.jsx      # Analytics with Recharts (bar + donut charts)
│       │   ├── NaukriScraperPage.jsx  # Scraper/apply control center + live WS terminal
│       │   ├── JobTrackingPage.jsx    # Job pipeline with match scores + status tabs
│       │   └── ExternalWalkinPage.jsx # External portal links + walk-in drives
│       ├── Dockerfile                  # Multi-stage: Node 20 Alpine → Nginx Alpine
│       ├── nginx.conf                  # SPA routing + API proxy + WebSocket proxy
│       ├── firebase.json              # Firebase Hosting config with security headers
│       ├── vercel.json                # Vercel SPA rewrite (alternative deploy)
│       └── package.json               # Node.js dependencies
│
├── docker-compose.yml                  # Multi-container: backend + frontend
├── .env.example                        # Environment variable template
├── 1_start_backend.bat                 # Start FastAPI backend locally
├── 2_start_tunnel.bat                  # Start Cloudflare tunnel (expose localhost)
├── 3_deploy_frontend.bat              # Build + deploy frontend to Firebase
├── start_all_local.bat                 # Start both services locally
├── start_with_tunnel.bat              # Full automated: backend → tunnel → build → deploy
├── run_app.bat                         # Docker Compose launcher
├── build_and_push.bat                 # Build & push Docker images to Docker Hub
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

| Tool               | Required For           | Install                                              |
|--------------------|------------------------|------------------------------------------------------|
| **Python 3.9+**    | Backend                | [python.org](https://www.python.org/)                |
| **Node.js 20+**    | Frontend               | [nodejs.org](https://nodejs.org/)                    |
| **Google Chrome**  | Selenium automation    | [google.com/chrome](https://www.google.com/chrome)   |
| **Docker** *(opt)* | Containerized deploy   | [docker.com](https://www.docker.com/)                |
| **Cloudflared** *(opt)* | Tunnel to internet | `winget install cloudflare.cloudflared`              |
| **Firebase CLI** *(opt)* | Frontend hosting  | `npm install -g firebase-tools`                     |

### Environment Variables

Create a `.env` file in the `naukri-automation-api/` directory:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://user:password@host:6543/postgres

# Authentication
SECRET_KEY=your-64-character-hex-secret-key

# AI (Groq Cloud - for screening question answering)
GROQ_API_KEY=gsk_your_groq_api_key

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://naukri-automation-sagar.web.app

# Server
PORT=8001
```

Create a `.env` file in `Naukri Frontend/naukri-frontend/`:

```env
VITE_API_URL=http://localhost:8001
```

> **💡 Tip:** Get a free Groq API key at [console.groq.com](https://console.groq.com)

### Local Development

#### Quick Start (Both services at once)

```bash
.\start_all_local.bat
```

This opens two terminal windows:
- **Backend** → `http://localhost:8001` (FastAPI + Uvicorn)
- **Frontend** → `http://localhost:5173` (Vite dev server)

#### Manual Setup

**Backend:**
```bash
cd naukri-automation-api

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Start the server
python main.py
```
> API docs available at `http://localhost:8001/docs` (Swagger UI)

**Frontend:**
```bash
cd "Naukri Frontend\naukri-frontend"

# Install dependencies
npm install

# Start dev server
npm run dev
```

### Docker Deployment

```bash
# Start both services with Docker Compose
.\run_app.bat
# OR
docker-compose up --build

# Build and push images to Docker Hub (optional)
.\build_and_push.bat
```

The Docker setup includes:
- **Backend**: Python 3.9 + Google Chrome Stable + matching ChromeDriver, `shm_size: 2gb`, `privileged: true` for headless browser automation.
- **Frontend**: Multi-stage build (Node 20 Alpine → Nginx Alpine) with API proxy and WebSocket support.

### Production Deployment (Tunnel + Firebase)

For running a live app with your local machine as the automation server:

```bash
# All-in-one automated pipeline (recommended)
.\start_with_tunnel.bat

# Or step-by-step:
.\1_start_backend.bat              # Start FastAPI server
.\2_start_tunnel.bat               # Create Cloudflare tunnel → copy the URL
.\3_deploy_frontend.bat            # Paste tunnel URL → builds & deploys to Firebase
```

🌐 **Live App**: [https://naukri-automation-sagar.web.app](https://naukri-automation-sagar.web.app)

---

## 📡 API Reference

Base URL: `http://localhost:8001`

### Authentication

| Method | Endpoint            | Auth | Description                     |
|--------|---------------------|------|---------------------------------|
| POST   | `/auth/register`    | ❌   | Register a new user              |
| POST   | `/auth/login`       | ❌   | Login & receive JWT token        |
| GET    | `/user/profile`     | ✅   | Get saved config & credentials   |

### Automation Tasks

| Method | Endpoint                      | Auth | Description                              |
|--------|-------------------------------|------|------------------------------------------|
| POST   | `/start_scrape`               | ✅   | Start job scraping (background task)      |
| POST   | `/start_apply`                | ✅   | Start auto-applying (background task)     |
| POST   | `/run_full_automation`        | ✅   | Run scrape → apply pipeline              |
| GET    | `/task_status/{username}`     | ✅   | Check task status (running/paused)        |
| POST   | `/pause_task/{username}`      | ✅   | Pause running task                        |
| POST   | `/resume_task/{username}`     | ✅   | Resume paused task                        |
| POST   | `/stop_task/{username}`       | ✅   | Stop and terminate task                   |

### Real-Time Streaming

| Protocol  | Endpoint               | Description                                      |
|-----------|------------------------|--------------------------------------------------|
| WebSocket | `/ws/logs/{username}`  | Live log stream + progress events + completion    |

### Data & Analytics

| Method | Endpoint                          | Auth | Description                            |
|--------|-----------------------------------|------|----------------------------------------|
| GET    | `/dashboard_stats/{email}`        | ✅   | Stats, daily trends, distributions      |
| GET    | `/scraped_jobs/{email}`           | ✅   | Filtered job listings (with status)      |
| GET    | `/external_jobs/{email}`          | ✅   | Jobs redirected to company portals       |
| GET    | `/walkin_jobs/{email}`            | ✅   | Walk-in interview drives                 |

> **Auth**: All protected endpoints require `Authorization: Bearer <JWT_TOKEN>` header.

---

## 🗄 Database Schema

PostgreSQL database hosted on **Supabase** with 3 tables:

### `website_users` — Platform Authentication
| Column          | Type      | Description                    |
|-----------------|-----------|--------------------------------|
| `email`         | TEXT (PK) | User's email                   |
| `username`      | TEXT      | Display name                   |
| `password_hash` | TEXT      | bcrypt hashed password         |
| `created_at`    | TIMESTAMP | Registration timestamp         |

### `users` — Automation Configuration
| Column          | Type      | Description                              |
|-----------------|-----------|------------------------------------------|
| `email`         | TEXT (PK) | User's email                             |
| `naukri_password`| TEXT     | Encrypted Naukri credentials             |
| `scrape_config` | JSONB     | Search parameters, filters, thresholds   |
| `resume_data`   | JSONB     | Experience, CTC, notice period, skills   |
| `last_active`   | TIMESTAMP | Last activity timestamp                  |

### `scraped_jobs` — Job Pipeline
| Column                    | Type      | Description                                            |
|---------------------------|-----------|--------------------------------------------------------|
| `id`                      | SERIAL (PK) | Auto-increment ID                                   |
| `username`                | TEXT      | Owner user                                             |
| `Role`, `Title`, `Company`| TEXT     | Job listing details                                    |
| `Apply_Link`             | TEXT      | Naukri job URL (unique per user)                       |
| `Description`            | TEXT      | Full job description                                   |
| `Tech_Keywords`          | TEXT      | Extracted technical keywords                           |
| `tech_match_score`       | REAL      | AI-computed skill match percentage                     |
| `kept_by_filter`         | TEXT      | Whether job passed filter (`yes`/`no`)                 |
| `applied_status`         | TEXT      | `PENDING` · `APPLIED` · `EXTERNAL` · `WALK-IN` · `FAILED` |
| `applied_timestamp`      | TIMESTAMP | When the application was submitted                     |
| `application_notes`      | TEXT      | AI-generated application notes                         |
| `JD_Extracted_Experience`| JSON      | Experience parsed from JD                              |
| `Notice_Period`, `Current_CTC`, `Expected_CTC` | TEXT | Candidate metadata               |
| `timestamp`              | TIMESTAMP | When the job was scraped                               |

**Constraint**: `UNIQUE (username, Apply_Link)` — prevents duplicate scraping per user.

---

## 📸 Screenshots

> *Coming soon — screenshots of the landing page, dashboard, scraper controls, job pipeline, and live terminal.*

<!-- Uncomment and add when available:
![Landing Page](screenshots/landing.png)
![Dashboard](screenshots/dashboard.png)
![Scraper Controls](screenshots/scraper.png)
![Job Pipeline](screenshots/pipeline.png)
![Live Terminal](screenshots/terminal.png)
-->

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** this repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/your-username/Job-Application-Automation.git
   ```
3. Create a **feature branch**:
   ```bash
   git checkout -b feature/awesome-feature
   ```
4. **Commit** your changes:
   ```bash
   git commit -m "Add awesome feature"
   ```
5. **Push** and open a **Pull Request**

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Made with ❤️ by <strong>Sagar Ghodke</strong>
</p>

<p align="center">
  <a href="https://github.com/sagarghodke1204">
    <img src="https://img.shields.io/badge/GitHub-sagarghodke1204-181717?logo=github&logoColor=white" alt="GitHub"/>
  </a>
</p>
