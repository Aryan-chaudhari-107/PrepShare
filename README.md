# PrepShare 🚀

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB.svg?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1.svg?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**PrepShare** is a full-stack, community-driven interview intelligence platform designed for students, developers, and job seekers to share, discover, and prepare for technical and behavioral interviews. It provides company-specific interview archives, round-by-round question breakdowns, community difficulty voting, direct messaging, and interactive preparation tracking.

---

## ✨ Features

- **📑 Detailed Interview Experiences**: Filter and explore interview rounds (Online Assessment, Technical, System Design, HR) across top companies with compensation ranges, offer statuses, and question tags.
- **⚡ Interactive Question Breakdown**: Mark interview questions as completed, vote on difficulty (Easy, Medium, Hard), and track your preparation progress.
- **✍️ Creator Workspace**: Rich drafting interface with live word count, multi-round builders, question tagging, and draft autosaving.
- **💬 Real-Time Discussion & Messages**: Threaded commentary on interview posts, instant 1-on-1 direct messaging, and unread notification alerts.
- **🏆 Gamification & Profiles**: Contribution points, active badges, bookmark collections, solved question counters, and user activity history.
- **🎨 Modern Design System**: Responsive 1680px ultra-wide layout, tailored warm ivory (`#FAF7EE`), alpine olive (`#3F6F52`), and deep navy (`#0F1926`) theme built for clean readability.

---

## 🛠️ Tech Stack

### **Backend**
- **Framework**: FastAPI (Python 3.10+)
- **Database ORM**: SQLAlchemy 2.0 with Alembic Migrations
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens) with Argon2/Bcrypt password hashing & session management
- **Validation**: Pydantic v2
- **Testing**: End-to-end integration test suites & security auditing

### **Frontend**
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS with custom CSS variable design tokens
- **Icons**: Lucide React
- **Routing & State**: React Router v6 & Context API (Auth + Toast notifications)
- **HTTP Client**: Axios with automatic interceptors and error handling

---

## 📁 Project Structure

```text
PrepShare/
├── Backend/
│   ├── _01_core/           # DB connection, security & config settings
│   ├── _02_models/         # 28 SQLAlchemy ORM database models
│   ├── _03_schemas/        # Pydantic request/response schemas
│   ├── _04_repositories/   # Data access layer
│   ├── _05_services/       # Business logic services
│   ├── _06_routers/        # REST API endpoints (Auth, Posts, Chat, etc.)
│   ├── alembic/            # Database schema migrations
│   ├── scripts/            # Database seeding & migration scripts
│   ├── tests/              # Automated integration & security tests
│   ├── utils/              # Helper utilities (OTP, email, slug generation)
│   ├── alembic.ini         # Alembic configuration
│   ├── main.py             # FastAPI entrypoint & middleware
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Environment variable template
│   └── .gitignore          # Backend ignore rules
│
├── Frontend/
│   ├── src/
│   │   ├── api/            # API client and endpoints
│   │   ├── components/     # Reusable UI components (feed, detail, layout, modals)
│   │   ├── context/        # Auth & Toast context providers
│   │   ├── pages/          # Application views (Feed, Detail, Drafts, Profile, etc.)
│   │   ├── types/          # TypeScript interfaces
│   │   ├── App.tsx         # Route configuration
│   │   ├── index.css       # Global styles and theme color definitions
│   │   └── main.tsx        # React DOM render entry
│   ├── index.html          # HTML template
│   ├── package.json        # Dependencies & scripts
│   ├── tailwind.config.js  # Tailwind theme configuration
│   ├── tsconfig.json       # TypeScript configuration
│   ├── vite.config.ts      # Vite build configuration
│   └── .gitignore          # Frontend ignore rules
│
├── .gitignore               # Root gitignore protecting secrets & temp files
└── README.md                # Project documentation
```

---

## 🌐 API Overview

| Router | Base Route | Key Operations |
| :--- | :--- | :--- |
| **Auth** | `/api/v1/auth` | Register, Login, Refresh Token, Logout, Password Reset OTP |
| **Posts** | `/api/v1/posts` | List Feed, Search/Filter, Create Draft, Publish, Update, Like, Share |
| **Questions** | `/api/v1/questions` | Vote Difficulty (Easy/Medium/Hard), Toggle Completed |
| **Comments** | `/api/v1/comments` | Threaded Comments, Add Reply, Edit, Delete |
| **Bookmarks** | `/api/v1/bookmarks` | Save Post, List Saved Posts |
| **Chat** | `/api/v1/chat` | 1-on-1 Direct Messaging, Conversation Inbox, Mark Read |
| **Notifications** | `/api/v1/notifications` | Unread Alerts, Mark All Read |
| **Users** | `/api/v1/users` | Profile Settings, User Post History, Follow/Unfollow |
| **Companies** | `/api/v1/companies` | Company Directory & Search |

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: 18.0 or higher
- **PostgreSQL**: Running instance

---

### 2. Backend Setup

1. **Navigate to the Backend directory**:
   ```bash
   cd Backend
   ```

2. **Create and activate a virtual environment**:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\activate

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your database credentials:
   ```bash
   cp .env.example .env
   ```

5. **Run database migrations & seed demo data**:
   ```bash
   alembic upgrade head
   python scripts/seed_demo_data.py
   ```

6. **Start the FastAPI server**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   - API Endpoint: `http://127.0.0.1:8000`
   - Interactive Swagger Docs: `http://127.0.0.1:8000/docs`

---

### 3. Frontend Setup

1. **Navigate to the Frontend directory**:
   ```bash
   cd Frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
   - Frontend Application: `http://localhost:5173`

---

## 🧪 Testing & Verification

### Backend Automated Test Suite
Run the full automated integration test flow:
```bash
python Backend/tests/manual_flow.py
```

Run the security audit check:
```bash
python Backend/tests/security_audit.py
```

### Frontend Type-Check & Production Build
```bash
cd Frontend
npm run build
```

---

## 🔒 Security & Best Practices
- **Password Protection**: Argon2 / Bcrypt password hashing.
- **Token Security**: Dual-token architecture (Access + Refresh tokens) with token version revocation.
- **Validation**: Strict schema validation using Pydantic on all request payloads.
- **Privacy & Safety**: Environment files (`.env`), credentials, and local build files are strictly excluded via `.gitignore`.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
