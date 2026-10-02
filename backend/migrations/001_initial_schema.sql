-- CAMPUS-Q&A PostgreSQL Database Schema
-- Migration 001: Initial Schema

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  student_id VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'mentor', 'faculty', 'admin')),
  reputation INT DEFAULT 0,
  subjects JSONB DEFAULT '[]'::jsonb,
  badges JSONB DEFAULT '[]'::jsonb,
  avatar_initials VARCHAR(10) NOT NULL,
  institution VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
  id VARCHAR(50) PRIMARY KEY,
  author_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  subject VARCHAR(100) NOT NULL,
  topic VARCHAR(100) NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  attachment_name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'solved')),
  urgency VARCHAR(20) DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent')),
  upvotes INT DEFAULT 0,
  views INT DEFAULT 0,
  answer_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS answers (
  id VARCHAR(50) PRIMARY KEY,
  question_id VARCHAR(50) NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  author_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_accepted BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  answer_type VARCHAR(30) DEFAULT 'PEER_ANSWER' CHECK (answer_type IN ('AI_SUGGESTED', 'PEER_ANSWER', 'FACULTY_ANSWER', 'ACCEPTED', 'FACULTY_VERIFIED')),
  upvotes INT DEFAULT 0,
  verified_by VARCHAR(50) REFERENCES users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS answer_replies (
  id VARCHAR(50) PRIMARY KEY,
  answer_id VARCHAR(50) NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
  author_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id VARCHAR(50) NOT NULL,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('question', 'answer')),
  vote_type INT NOT NULL CHECK (vote_type IN (1, -1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, content_id, content_type)
);

CREATE TABLE IF NOT EXISTS saved_questions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id VARCHAR(50) NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, question_id)
);

CREATE TABLE IF NOT EXISTS mentor_profiles (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expertise JSONB DEFAULT '[]'::jsonb,
  verified BOOLEAN DEFAULT TRUE,
  helpful_answers INT DEFAULT 0,
  bio TEXT,
  response_time VARCHAR(100),
  department VARCHAR(100),
  year_or_designation VARCHAR(50),
  availability VARCHAR(100),
  contact_method VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL CHECK (type IN ('answer', 'accepted', 'upvote', 'mentor', 'similar', 'report', 'urgent', 'verified')),
  message TEXT NOT NULL,
  question_id VARCHAR(50) REFERENCES questions(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
  id VARCHAR(50) PRIMARY KEY,
  reporter_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id VARCHAR(50) NOT NULL,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('question', 'answer', 'user')),
  excerpt TEXT NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'removed', 'dismissed', 'warned')),
  reviewed_by VARCHAR(50) REFERENCES users(id),
  action_taken TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS moderation_logs (
  id SERIAL PRIMARY KEY,
  moderator_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  report_id VARCHAR(50) REFERENCES reports(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campus_resources (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  type VARCHAR(50) NOT NULL,
  department VARCHAR(100),
  venue VARCHAR(150),
  description TEXT,
  contact_method VARCHAR(150),
  working_hours VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  status VARCHAR(30) DEFAULT 'in_progress',
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_steps (
  id VARCHAR(50) PRIMARY KEY,
  task_id VARCHAR(50) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  instruction TEXT NOT NULL,
  resource_id VARCHAR(50) REFERENCES campus_resources(id),
  required_role VARCHAR(50),
  completed BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS knowledge_base (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  subject VARCHAR(100) NOT NULL,
  topic VARCHAR(100),
  tags JSONB DEFAULT '[]'::jsonb,
  source_question_id VARCHAR(50) REFERENCES questions(id) ON DELETE SET NULL,
  source_answer_id VARCHAR(50) REFERENCES answers(id) ON DELETE SET NULL,
  verified_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(30) DEFAULT 'VERIFIED_CAMPUS_ANSWER',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_author ON questions(author_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_urgency ON questions(urgency);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_author ON answers(author_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_votes_content ON votes(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_questions(user_id);
