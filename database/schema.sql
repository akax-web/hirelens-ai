-- HireLens AI Database Schema
-- Run this script manually or let Spring Boot auto-create via ddl-auto=update

CREATE DATABASE IF NOT EXISTS hirelens_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE hirelens_db;

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    email       VARCHAR(150)    NOT NULL UNIQUE,
    password    VARCHAR(255)    NOT NULL,
    skills      TEXT,
    created_at  DATETIME        DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- INTERVIEWS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS interviews (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id          BIGINT          NOT NULL,
    title            VARCHAR(200)    NOT NULL,
    mode             ENUM('PRACTICE','MOCK') NOT NULL DEFAULT 'PRACTICE',
    overall_score    INT,
    strengths        TEXT,
    weaknesses       TEXT,
    improvement_tips TEXT,
    skills_tested    VARCHAR(500),
    created_at       DATETIME        DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_interviews_user_id (user_id),
    INDEX idx_interviews_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- QUESTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS questions (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    interview_id   BIGINT  NOT NULL,
    question_text  TEXT    NOT NULL,
    order_index    INT     DEFAULT 1,
    FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE,
    INDEX idx_questions_interview_id (interview_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- ANSWERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS answers (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    question_id  BIGINT  NOT NULL UNIQUE,
    answer_text  TEXT,
    score        INT     DEFAULT 0,
    feedback     TEXT,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_answers_question_id (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- DEMO USER (password = demo1234, BCrypt hash)
-- Will also be auto-created by DataInitializer on startup
-- ============================================================
INSERT IGNORE INTO users (name, email, password, skills)
VALUES (
    'Demo User',
    'demo@hirelens.ai',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Java, Spring Boot, MySQL, REST APIs, React'
);
