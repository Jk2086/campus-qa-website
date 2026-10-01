# Campus Connect

Build the FRONTEND of a modern, responsive web application called CAMPUS-Q&A.

Tagline:

“Ask. Learn. Share. Grow.”

This is a hackathon prototype for an institution-exclusive Student Q&A and Collaborative Learning Portal.

IMPORTANT:

- Focus on the frontend, UI, UX and complete user flows.

- Do NOT build the final backend/database.

- Create clean API/service interfaces so the frontend can later connect to a separate backend built using Antigravity.

- Use realistic mock data initially.

- Keep all backend-dependent operations modular and easy to replace with REST API calls.

DESIGN:

- Modern EdTech/SaaS appearance

- Professional hackathon-quality UI

- Clean navy, white and blue visual theme

- Responsive desktop + mobile design

- Rounded cards

- Clear typography

- Subtle animations

- Accessible UI

- Avoid excessive visual clutter

PAGES:

1. LOGIN / REGISTER

- Institution email / Student ID

- Password

- Login

- Register

- Forgot password

- Demo login buttons for Student, Mentor and Admin

Clearly communicate:

“Exclusive to your institution”

2. STUDENT DASHBOARD

Header:

- CAMPUS-Q&A logo

- Global search

- Notifications

- Profile

Navigation:

- Home

- Explore

- Ask Question

- My Questions

- Saved

- Mentors

- Notifications

- Profile

Dashboard:

- Welcome message

- Search bar: “What are you stuck on?”

- Ask Question button

- Trending Questions

- Recent Questions

- Unanswered Questions

- Recommended Questions

- Popular Topics

3. EXPLORE / SEARCH

Create searchable question listings.

Filters:

- Subject

- Topic

- Tags

- Recent

- Popular

- Unanswered

- Solved

Question cards should show:

- Title

- Description preview

- Subject

- Tags

- Author

- Answers

- Upvotes

- Status

4. ASK QUESTION

Form:

- Question title

- Description

- Subject

- Tags

- Attachment

- Post Question

- Save Draft

Before submission show:

“Similar questions you may want to check”

5. QUESTION DETAIL

Display:

- Question

- Author

- Subject

- Tags

- Upvotes

- Save

- Report

- Similar Questions

Answers:

- Answer content

- Author

- Student/Mentor/Faculty badge

- Upvote

- Reply

- Report

- Accepted Answer

Question owner can mark an answer as accepted.

6. AI ASSISTANT UI

Create an AI Assistant card with:

- AI Hint

- Explain Concept

- Related Questions

Show:

“AI-generated assistance may contain errors. Verify important academic information.”

The frontend should call a future backend AI endpoint rather than hard-coding the final architecture.

7. MENTORS

Create a mentor directory.

Mentor cards:

- Name

- Verified badge

- Subject expertise

- Helpful answers

- Reputation

- View Profile

8. PROFILE

Show:

- Display name

- Role

- Subjects

- Reputation

- Questions asked

- Answers

- Accepted answers

- Badges

9. NOTIFICATIONS

Examples:

- New answer

- Answer accepted

- Question upvoted

- Mentor responded

- Similar question found

10. MODERATION

Create an Admin/Moderator interface.

Show:

- Reported questions

- Reported answers

- Report reason

- Status

- Review

- Remove

- Dismiss

- Warn user

11. RESPONSIVE MOBILE DESIGN

On mobile:

- Bottom navigation

- Collapsible menu

- Mobile-friendly question cards

- Floating Ask Question button

- Easy search access

MOCK DATA:

Use realistic academic questions covering:

Computer Science

Biology

Biotechnology

Physics

Chemistry

Mathematics

Examples:

“How does recursion work in C?”

“How does PCR amplify DNA?”

“What is the difference between mitosis and meiosis?”

“How do I calculate the electric field of a point charge?”

FRONTEND API STRUCTURE:

Create a clean service layer with placeholder functions such as:

auth.login()

auth.register()

questions.getQuestions()

questions.getQuestion()

questions.createQuestion()

questions.searchQuestions()

questions.getSimilarQuestions()

answers.createAnswer()

answers.acceptAnswer()

votes.vote()

reports.createReport()

mentors.getMentors()

notifications.getNotifications()

ai.getHint()

Initially these can use mock data.

Structure the code so these functions can later call REST endpoints from the Antigravity backend.

Do NOT expose API keys in the frontend.

FINAL RESULT:

Create a polished, working frontend prototype demonstrating:

LOGIN → DASHBOARD → SEARCH → ASK QUESTION → ANSWER → ACCEPT ANSWER → MODERATION

The application should look and behave like a real product, while keeping backend integration separate for later connection to Antigravity. Then Antigravity = backend

Once Lovable gives you the frontend, don't immediately ask Antigravity to build something unrelated.

Give Antigravity the backend requirements based on the exact API structure:

Build the BACKEND for the CAMPUS-Q&A hackathon application.

The frontend is being developed separately in Lovable.

Your backend must provide REST APIs that the Lovable frontend can consume.

PROJECT:

CAMPUS-Q&A is an institution-exclusive academic Q&A and collaborative learning platform connecting students, peers, mentors and faculty.

CORE REQUIREMENTS:

1. AUTHENTICATION

Implement:

- Registration

- Login

- Logout

- Session/token handling

- Role-based authentication

Roles:

- Student

- Mentor

- Faculty

- Admin

Institution-only access should be supported.

2. DATABASE

Create database models/tables for:

USERS

- id

- name

- email

- student_id

- password_hash

- role

- reputation

- created_at

QUESTIONS

- id

- user_id

- title

- description

- subject

- tags

- status

- created_at

ANSWERS

- id

- question_id

- user_id

- content

- is_accepted

- created_at

VOTES

- id

- user_id

- content_id

- vote_type

REPORTS

- id

- reporter_id

- content_id

- reason

- status

- created_at

NOTIFICATIONS

- id

- user_id

- message

- read

- created_at

MENTOR_PROFILES

- id

- user_id

- expertise

- verified

3. QUESTION APIs

Implement endpoints for:

POST /questions

GET /questions

GET /questions/:id

PUT /questions/:id

DELETE /questions/:id

GET /questions/search

GET /questions/similar

Support:

- Subject filtering

- Tags

- Search

- Pagination

- Sorting

- Status filtering

4. ANSWER APIs

POST /questions/:id/answers

GET /questions/:id/answers

PUT /answers/:id

DELETE /answers/:id

POST /answers/:id/accept

Only the question owner should be able to accept an answer.

5. VOTING

Implement:

- Upvote/downvote

- Prevent duplicate votes

- Update reputation where appropriate

6. MENTOR APIs

GET /mentors

GET /mentors/:id

Support mentor expertise and verification status.

7. AI INTEGRATION

Create modular endpoints:

POST /ai/hint

POST /ai/similar-questions

POST /ai/classify

POST /ai/moderate

The AI service should be replaceable/configurable.

If no AI API is available, implement safe mock responses for the hackathon prototype.

AI should assist rather than be treated as an authoritative source.

8. MODERATION

Implement:

POST /reports

GET /admin/reports

PUT /admin/reports/:id

Admin/moderator actions:

- Review

- Dismiss

- Remove content

- Warn/restrict user

Include basic spam/toxicity moderation logic or a modular AI moderation service.

9. NOTIFICATIONS

Create notifications when:

- A question receives an answer

- An answer is accepted

- An answer receives a vote

- A mentor responds

- A report status changes

10. SECURITY

Implement:

- Password hashing

- Authentication middleware

- Role-based authorization

- Input validation

- Rate limiting

- Secure error handling

- CORS configuration

- No secrets in source code

- Environment variables for API keys/database credentials

11. API DOCUMENTATION

Provide clear API documentation showing:

Endpoint

Method

Authentication required

Request body

Response format

Error responses

12. FRONTEND INTEGRATION

The Lovable frontend will call this backend.

Use consistent JSON response structures.

Example:

POST /questions

Request:

{

"title": "How does recursion work in C?",

"description": "...",

"subject": "Computer Science",

"tags": ["C", "Recursion"]

}

Response:

{

"success": true,

"question": {...}

}

Make the API easy for the Lovable frontend service layer to consume.

FINAL GOAL:

Provide a working backend supporting:

AUTHENTICATION

→ QUESTIONS

→ SEARCH

→ ANSWERS

→ VOTING

→ ACCEPTED ANSWERS

→ MENTORS

→ AI ASSISTANCE

→ REPORTING

→ MODERATION

→ NOTIFICATIONS

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/294b884a-9f9b-5801-9d5a-c4008d8c6691).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
