# CAMPUS-Q&A Backend

> Institution-exclusive Student Q&A and Collaborative Learning Portal Backend
>
> Core Philosophy: **ANSWER → GUIDE → CONNECT**

---

## 1. Overview & Architecture

The CAMPUS-Q&A backend is a database-backed RESTful service built with **Node.js, Express.js, and PostgreSQL**. It is engineered to seamlessly integrate with the existing Lovable frontend prototype, matching all API response contracts, data types, and authentication flows while adding enterprise-grade features:

- **Institution-Exclusive Access**: Configurable email domain & student ID validation with JWT and bcrypt security.
- **Role-Based Access Control (RBAC)**: Support for `student`, `mentor`, `faculty`, and `admin` roles with granular permission gates.
- **Intelligent Academic AI Assistant**: Multi-tiered **Answer → Guide → Connect** pipeline:
  - `SIMPLE_DOUBT`: Friendly, direct academic answers.
  - `COMPLEX_DOUBT`: Hints and concept walkthroughs without fabricating, routing to mentors (`AI_UNCERTAIN`).
  - `CAMPUS_NAVIGATION`: Grounded in database-backed campus resources, venues, and administrative desks.
  - `TASK_GUIDANCE`: Actionable workflow steps linked to institutional clearance tasks.
  - `URGENT_HELP`: High-priority mentor routing and immediate academic assistance.
- **Verified Campus Knowledge Base**: Direct instant verification for known institutional guidelines and verified answers before invoking AI.
- **Smart Mentor Routing**: Algorithmic matching of questions to peer mentors and faculty based on subject, topic, tags, department, and helpful reputation.
- **Unified Campus Search**: Keyword search spanning questions, answers, topics, tags, campus resources, and mentor profiles.
- **Embedded Database Dual-Engine**: Runs against live PostgreSQL servers or automatically falls back to an embedded in-memory PostgreSQL engine (`pg-mem`) for instantaneous, zero-configuration local evaluation and hackathon judging.

---

## 2. Directory Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── env.js               # Environment configuration and defaults
│   │   └── db.js                # PostgreSQL pool with automatic in-memory fallback
│   ├── controllers/
│   │   ├── authController.js    # Login, registration, demo-login, user profile
│   │   ├── questionController.js# Question CRUD, filtering, topics, saving, urgency
│   │   ├── answerController.js  # Answers, verification, replies, acceptance
│   │   ├── voteController.js    # Duplicate-preventing upvote/downvote engine
│   │   ├── mentorController.js  # Mentor discovery and routing
│   │   ├── aiController.js      # Hint, Explain, Similar, and AI Query pipeline
│   │   ├── notificationController.js # Real-time alerts and read receipts
│   │   ├── reportController.js  # Content moderation queue and audit logging
│   │   ├── resourceController.js# Campus offices, venues, and labs directory
│   │   ├── taskController.js    # Academic workflows and procedural step guidance
│   │   ├── knowledgeController.js # Institutional verified knowledge base
│   │   └── searchController.js  # Unified multi-entity campus search
│   ├── middleware/
│   │   ├── auth.js              # JWT verification and user hydration
│   │   ├── rbac.js              # Role authorization guards
│   │   ├── errorHandler.js      # Centralized error handler
│   │   ├── rateLimiter.js       # IP-based rate limiting
│   │   └── validator.js         # Input validation & institution domain checks
│   ├── models/
│   │   ├── User.js
│   │   ├── Question.js
│   │   ├── Answer.js
│   │   ├── Vote.js
│   │   ├── MentorProfile.js
│   │   ├── Notification.js
│   │   ├── Report.js
│   │   ├── CampusResource.js
│   │   ├── Task.js
│   │   └── KnowledgeBase.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── questionRoutes.js
│   │   ├── answerRoutes.js
│   │   ├── voteRoutes.js
│   │   ├── mentorRoutes.js
│   │   ├── aiRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── resourceRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── knowledgeRoutes.js
│   │   └── searchRoutes.js
│   ├── services/
│   │   ├── aiService.js         # Multi-tiered Answer-Guide-Connect engine
│   │   ├── routingService.js    # Smart peer mentor & faculty routing
│   │   ├── searchService.js     # Unified search aggregation
│   │   └── seedService.js       # Database migration and seed script
│   ├── utils/
│   │   ├── response.js          # Standardized JSON response envelope
│   │   ├── token.js             # JWT signer & verifier
│   │   └── logger.js            # Structured logger
│   ├── app.js                   # Express application setup (dual /api & root mounts)
│   └── server.js                # Server entrypoint
├── migrations/
│   ├── 001_initial_schema.sql   # Normalized PostgreSQL tables and indexes
│   └── 002_seed_data.sql        # Realistic demo users, questions, answers, and resources
├── tests/
│   ├── auth.test.js             # Authentication & session test suite
│   ├── questions.test.js        # Questions, filters, saving & search test suite
│   ├── answers.test.js          # Answers, acceptance, verification & voting test suite
│   ├── ai.test.js               # AI Assistant Answer-Guide-Connect test suite
│   └── routing_and_moderation.test.js # Mentors, reports, moderation & search suite
├── .env.example
├── .env
├── package.json
└── README.md
```

---

## 3. Database Schema

The PostgreSQL schema is fully normalized with primary keys, foreign key constraints, indexes, and unique constraints to ensure data integrity and prevent duplicate votes:

| Table | Description | Key Fields |
|---|---|---|
| `users` | Institutional accounts | `id`, `name`, `email`, `student_id`, `password_hash`, `role`, `reputation`, `subjects`, `badges` |
| `questions` | Academic questions | `id`, `author_id`, `title`, `description`, `subject`, `topic`, `tags`, `status`, `urgency`, `upvotes`, `views`, `answer_count` |
| `answers` | Peer and faculty answers | `id`, `question_id`, `author_id`, `content`, `is_accepted`, `is_verified`, `answer_type`, `upvotes` |
| `answer_replies` | Threaded discussions | `id`, `answer_id`, `author_id`, `content`, `created_at` |
| `votes` | Content voting engine | `user_id`, `content_id`, `content_type`, `vote_type` (Unique constraint prevents duplicates) |
| `saved_questions` | User revision library | `user_id`, `question_id` (Unique constraint) |
| `mentor_profiles` | Mentor credentials | `id`, `user_id`, `expertise`, `verified`, `helpful_answers`, `bio`, `response_time`, `department` |
| `notifications` | User alert feed | `id`, `user_id`, `type`, `message`, `question_id`, `read` |
| `reports` | Moderation flags | `id`, `reporter_id`, `content_id`, `content_type`, `excerpt`, `reason`, `status`, `reviewed_by` |
| `moderation_logs`| Audit history | `id`, `moderator_id`, `report_id`, `action`, `details`, `created_at` |
| `campus_resources`| Grounded venue directory | `id`, `name`, `type`, `department`, `venue`, `description`, `contact_method`, `working_hours` |
| `tasks` | Academic task checklists | `id`, `title`, `description`, `category`, `due_date` |
| `task_steps` | Procedural step workflows | `id`, `task_id`, `step_order`, `instruction`, `resource_id`, `required_role` |
| `knowledge_base` | Institutional knowledge | `id`, `title`, `content`, `subject`, `topic`, `tags`, `status`, `verified_by` |

---

## 4. API Endpoints Reference

All endpoints return standardized JSON envelopes matching the Lovable frontend format:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Authentication & Users
- `POST /api/auth/login` (Body: `{ identifier, password }`) - Returns user profile and JWT token.
- `POST /api/auth/register` (Body: `{ name, email, studentId, password, role }`) - Creates account.
- `POST /api/auth/demo-login` (Body: `{ role: 'student' | 'mentor' | 'faculty' | 'admin' }`) - Demo shortcut for hackathon judging.
- `GET /api/auth/demo/:role` - Demo shortcut via URL.
- `POST /api/auth/logout` - Disposes session.
- `POST /api/auth/forgot-password` (Body: `{ email }`) - Dispatches reset link.
- `GET /api/auth/me` or `GET /api/users/me` - Authenticated profile.
- `PUT /api/users/me` - Update profile name, subjects, badges.
- `GET /api/users` - List campus users with optional `role` and `department` filtering.
- `GET /api/users/:id` - Fetch single user profile.
- `PATCH /api/users/:id/availability` (Body: `{ availability: 'available' | 'busy' | 'in_class' | 'offline' }`) - Update availability.

### Questions
- `GET /api/questions` - Query parameters: `search`, `subject`, `tags`, `sort` (`recent` / `popular`), `status` (`open` / `solved` / `unanswered`), `limit`, `authorId`.
- `GET /api/questions/:id` - Fetch question details (auto-increments views).
- `GET /api/questions/search?q=...` - Keyword search.
- `GET /api/questions/similar?title=...&subject=...` - Find matching questions before posting.
- `POST /api/questions` (Body: `{ title, description, subject, tags, attachmentName, authorId }`) - Creates question & routes to mentors.
- `PUT /api/questions/:id` - Update question (author or admin).
- `DELETE /api/questions/:id` - Delete question (author or admin).
- `POST /api/questions/:id/urgent` - Elevate priority and dispatch urgent mentor alerts.
- `POST /api/questions/:id/save` - Toggle save for user revision library.
- `GET /api/me/saved` - Retrieve saved questions for user.
- `GET /api/topics/popular` - Aggregated trending topics with count.
- `POST /api/questions/:id/report` - Report question for moderation.

### Answers & Verification
- `GET /api/questions/:id/answers` - Get answers with threaded replies (sorted by accepted first, then upvotes).
- `POST /api/questions/:id/answers` (Body: `{ content, authorId }`) - Post answer and notify asker.
- `PUT /api/answers/:id` - Update answer.
- `DELETE /api/answers/:id` - Delete answer.
- `POST /api/answers/:id/accept` - Question owner marks answer as accepted (+15 reputation to author).
- `POST /api/answers/:id/verify` - Faculty/Admin marks answer as `FACULTY_VERIFIED` (+25 reputation).
- `POST /api/answers/:id/unverify` - Faculty/Admin removes answer verification.
- `POST /api/answers/:id/replies` (Body: `{ authorId, content }`) - Post threaded reply.
- `POST /api/answers/:id/vote` (Body: `{ voteType: 1 | -1 }`) - Vote on answer.
- `POST /api/answers/:id/report` - Report answer.

### Voting
- `POST /api/votes` (Body: `{ contentId, contentType: 'question' | 'answer', voteType: 1 | -1 }`) - Atomic vote toggle.

### AI Assistant (Answer → Guide → Connect)
- `POST /api/ai/chat` (Body: `{ prompt, context?: { subject?, questionId? } }`) - Main conversational assistant endpoint implementing the 4 core situations:
  - Situation A: Simple Academic Doubts (direct, friendly, concise 🌱)
  - Situation B: Complex / Uncertain Doubts (concepts, hints, mentor & faculty routing, "Get Human Help")
  - Situation C: Campus Navigation (grounds response in database campus resources, venue, contact)
  - Situation D: Task Guidance (actionable workflow steps, checklist)
- `POST /api/ai/hint` (Body: `{ questionId }`) - Pedagogical hint guiding the student.
- `POST /api/ai/explain` (Body: `{ questionId }`) - Concept walkthrough and common pitfalls.
- `POST /api/ai/similar-questions` (Body: `{ questionId }`) - Contextual related questions.
- `POST /api/ai/query` (Body: `{ query, subject?, questionId? }`) - Full multi-tiered pipeline:
  - Searches verified campus knowledge base first.
  - Resolves campus navigation queries against real database venues.
  - Returns task guidance steps for institutional procedures.
  - Answers simple doubts immediately.
  - Categorizes complex/uncertain doubts as `AI_UNCERTAIN` and routes to mentors.
- `POST /api/ai/classify` (Body: `{ text }`) - Intent classifier.

### Mentors & Smart Routing
- `GET /api/mentors` - Filter mentors by `subject` and `search` query.
- `GET /api/mentors/:id` - Hydrated mentor profile.
- `GET /api/mentors/route?subject=...&topic=...` - Algorithmically matched mentors.

### Notifications
- `GET /api/notifications?userId=...` - Unread and historical notifications.
- `PUT /api/notifications/:id/read` - Mark specific notification as read.
- `PUT /api/notifications/read-all` - Mark all notifications as read.

### Campus Resources & Navigation
- `GET /api/resources` - Directory of offices, venues, coordinators, and labs with location, contactPerson, email.
- `GET /api/resources/:id` - Specific resource details.

### Academic Task Workflows
- `GET /api/tasks` - Procedural task workflows with ordered step-by-step guidance. Filter by `category` or `status`.
- `GET /api/tasks/:id` - Task with ordered step-by-step guidance and completion states.
- `POST /api/tasks/:id/step/:stepId/toggle` - Toggle step completion and update overall task status (`pending`, `in_progress`, `completed`).

### Verified Knowledge Base
- `GET /api/knowledge` - Institutional articles and verified answers.
- `GET /api/knowledge/search?q=...` - Search verified knowledge.
- `POST /api/knowledge` - Add new approved knowledge article.

### Moderation & Governance
- `POST /api/reports` - Report content.
- `GET /api/admin/reports` - Moderation queue (Faculty/Admin).
- `PUT /api/admin/reports/:id` (Body: `{ status: 'reviewing' | 'removed' | 'dismissed' | 'warned' }`) - Action report.
- `GET /api/moderation/logs` - Audit log of moderation decisions.

### Global Search
- `GET /api/search?q=...` - Unified multi-entity search returning questions, mentors, resources, knowledge, and aggregated trending topics.

---

## 5. Setup & Running Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation
```bash
cd backend
npm install
```

### Running Locally
```bash
# Starts the server on port 5000 (with automatic database migration and seed)
npm start

# Or with live-reload during development
npm run dev
```

### Running Tests
```bash
npm test
```
The test suite runs 51 comprehensive unit and integration tests verifying authentication, users, questions, answers, voting, faculty verification, AI pipelines, tasks, campus resources, mentor routing, and moderation with 100% pass rate.

---

## 6. Frontend Integration

The backend is configured to accept requests from the Lovable frontend prototype:
1. In `frontend/.env`, set:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```
2. Run the frontend dev server:
   ```bash
   cd frontend
   npm run dev
   ```
3. The frontend will now make live REST API requests to the backend with zero UI changes required. All data modifications (questions, answers, upvotes, bookmarks, reports) persist in the database.
