-- CTF Platform Database Schema

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS ctf_platform;

-- Use the database
\c ctf_platform;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    team_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    invite_code VARCHAR(20) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(10), 'hex'),
    leader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    max_members INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitions table
CREATE TABLE competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    competition_type VARCHAR(50) DEFAULT 'individual' CHECK (competition_type IN ('individual', 'team', 'mixed')),
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenges table
CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    points INTEGER NOT NULL,
    flag VARCHAR(255) NOT NULL,
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    is_visible BOOLEAN DEFAULT true,
    max_attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenge files table
CREATE TABLE challenge_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hints table
CREATE TABLE hints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    penalty INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submissions table
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    submitted_flag VARCHAR(255) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    points_awarded INTEGER DEFAULT 0,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Solves table (successful submissions only)
CREATE TABLE solves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    solved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    points_awarded INTEGER NOT NULL
);

-- Team members junction table
CREATE TABLE team_members (
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (team_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_team ON users(team_id);

CREATE INDEX idx_teams_invite_code ON teams(invite_code);
CREATE INDEX idx_teams_leader ON teams(leader_id);

CREATE INDEX idx_challenges_category ON challenges(category);
CREATE INDEX idx_challenges_competition ON challenges(competition_id);
CREATE INDEX idx_challenges_points ON challenges(points);
CREATE INDEX idx_challenges_difficulty ON challenges(difficulty);

CREATE INDEX idx_submissions_user ON submissions(user_id);
CREATE INDEX idx_submissions_team ON submissions(team_id);
CREATE INDEX idx_submissions_challenge ON submissions(challenge_id);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);

CREATE INDEX idx_solves_user ON solves(user_id);
CREATE INDEX idx_solves_team ON solves(team_id);
CREATE INDEX idx_solves_challenge ON solves(challenge_id);
CREATE INDEX idx_solves_solved_at ON solves(solved_at);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);

-- Create unique constraints to prevent duplicate solves
CREATE UNIQUE INDEX idx_unique_user_challenge ON solves(user_id, challenge_id);
CREATE UNIQUE INDEX idx_unique_team_challenge ON solves(team_id, challenge_id) WHERE team_id IS NOT NULL;

-- Insert sample data
INSERT INTO competitions (name, description, start_time, end_time, competition_type, is_public) VALUES
('CTF Competition 2024', 'Annual cybersecurity competition featuring various challenge categories', NOW() + INTERVAL '1 day', NOW() + INTERVAL '7 days', 'mixed', true);

INSERT INTO users (email, username, password_hash, role) VALUES
('admin@ctf.com', 'admin', '$2b$10$rQZ9qF8xL6KoF3yH9Jl.XuK5vQ2N8mP4RtRz8wF6aI0sK4nP7wM2C', 'admin'),
('user1@ctf.com', 'player1', '$2b$10$rQZ9qF8xL6KoF3yH9Jl.XuK5vQ2N8mP4RtRz8wF6aI0sK4nP7wM2C', 'user'),
('user2@ctf.com', 'player2', '$2b$10$rQZ9qF8xL6KoF3yH9Jl.XuK5vQ2N8mP4RtRz8wF6aI0sK4nP7wM2C', 'user');

INSERT INTO challenges (title, description, category, difficulty, points, flag, competition_id, is_visible) VALUES
('Web Basics', 'Find the flag in this simple web application', 'web', 'easy', 100, 'CTF{w3b_b4s1cs_123}', (SELECT id FROM competitions LIMIT 1), true),
('Crypto Starter', 'Decrypt this simple Caesar cipher', 'crypto', 'easy', 150, 'CTF{c4es4r_w4s_h3re}', (SELECT id FROM competitions LIMIT 1), true),
('Reverse Engineering', 'Analyze this binary and find the hidden flag', 'reverse', 'medium', 300, 'CTF{r3v3rs3_3ng1n33r}', (SELECT id FROM competitions LIMIT 1), true);