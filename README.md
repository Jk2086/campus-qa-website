http://localhost:5173

# CAMPUS-Q&A

> Institution-exclusive Student Q&A and Collaborative Learning Portal
>
> **"Ask. Learn. Share. Grow."**
>
> Core Philosophy: **ANSWER → GUIDE → CONNECT**
>
> Repository: [https://github.com/jk2086/campus-ask-mentor](https://github.com/jk2086/campus-ask-mentor)

---

## Project Structure

```
campus-ask-mentor/
├── frontend/             # Complete Lovable React + Vite + TypeScript prototype
│   ├── src/
│   │   ├── components/   # UI components, AppShell, AIAssistantCard, QuestionCard
│   │   ├── routes/       # Pages (Dashboard, Explore, Ask, Question Detail, Mentors, Moderation)
│   │   ├── services/     # REST API client connecting to backend
│   │   └── lib/          # Session and utility helpers
│   ├── package.json
│   └── .env              # VITE_API_BASE_URL=http://localhost:5000/api
├── backend/              # Node.js + Express.js + PostgreSQL REST backend
│   ├── src/
│   │   ├── config/       # Environment & PostgreSQL connection pool (with pg-mem fallback)
│   │   ├── controllers/  # Auth, Questions, Answers, Votes, AI, Mentors, Moderation, Resources
│   │   ├── middleware/   # JWT Authentication, RBAC guards, rate limiter, validators
│   │   ├── models/       # Normalized models for users, questions, answers, resources, tasks
│   │   ├── routes/       # Dual-mounted Express routes (/api and /)
│   │   └── services/     # Multi-tiered AI Answer-Guide-Connect pipeline & mentor routing
│   ├── migrations/       # Normalized PostgreSQL schema and realistic seed data
│   ├── tests/            # 40 comprehensive unit & integration tests
│   ├── package.json
│   └── README.md
└── README.md
```

---

## Quick Start (Running Both Locally)

### 1. Start the Backend
```bash
cd backend
npm install
npm start
```
The backend initializes the database schema and loads seed data automatically, listening on `http://localhost:5000`.

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser. The frontend automatically connects to `http://localhost:5000/api`.

---

## Demo Accounts

For fast evaluation during hackathon judging, use the **Demo access** buttons on the login page or sign in with:

| Role | Email / Student ID | Password | Key Capabilities |
|---|---|---|---|
| **Student** | `ananya.iyer@university.edu` / `CS22B041` | `campus2026` | Ask questions, mark urgent, upvote, accept answers, bookmark, use AI study assistant |
| **Peer Mentor** | `kabir.menon@university.edu` / `CS21B093` | `campus2026` | Receive routed questions in CS, answer questions, provide hints |
| **Faculty** | `meera.raghavan@university.edu` / `FAC-0192` | `campus2026` | Answer questions, verify answers with faculty badge (+25 reputation), moderate content |
| **Admin** | `moderation@university.edu` / `ADM-0001` | `campus2026` | Review moderation queue, remove content, issue user warnings, inspect audit logs |

---

## Verification & Testing
To run the automated backend test suite (40 tests across Auth, Questions, Answers, AI Pipeline, and Moderation):
```bash
cd backend
npm test
```
