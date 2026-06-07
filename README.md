# HireLens AI — Full-Stack AI Interview Coach

## Overview

A production-grade AI Interview Coach platform with JWT auth, resume skill parsing, AI-generated interview questions via OpenAI, answer evaluation with scoring, and a historical dashboard — all backed by a Java Spring Boot REST API and MySQL database.

---

## Architecture

```
HireLens AI/
├── backend/          ← Spring Boot (Java 17, Maven)
│   └── src/main/java/com/hirelens/
│       ├── config/         (Security, CORS, JWT, OpenAI)
│       ├── controller/     (Auth, Interview, Dashboard)
│       ├── service/        (Auth, Interview, AI, User)
│       ├── repository/     (JPA Repositories)
│       ├── model/          (User, Interview, Question, Answer)
│       ├── dto/            (Request/Response DTOs)
│       └── exception/      (GlobalExceptionHandler)
│
└── frontend/         ← React + Vite (plain CSS)
    └── src/
        ├── pages/          (Login, Register, Dashboard, Interview, Mock)
        ├── components/     (Navbar, QuestionCard, ScoreCard, etc.)
        ├── services/       (api.js — Axios wrapper)
        └── context/        (AuthContext)
```

---

## Database Schema

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | auto_increment |
| name | VARCHAR(100) | |
| email | VARCHAR(150) | UNIQUE |
| password | VARCHAR(255) | BCrypt hashed |
| skills | TEXT | comma-separated |
| created_at | DATETIME | |

### `interviews`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | |
| user_id | BIGINT FK | → users.id |
| title | VARCHAR(200) | e.g. "Java Backend Interview" |
| mode | ENUM | PRACTICE / MOCK |
| overall_score | INT | 0–100 |
| strengths | TEXT | |
| weaknesses | TEXT | |
| improvement_tips | TEXT | |
| created_at | DATETIME | |

### `questions`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | |
| interview_id | BIGINT FK | → interviews.id |
| question_text | TEXT | |
| order_index | INT | |

### `answers`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | |
| question_id | BIGINT FK | → questions.id |
| answer_text | TEXT | |
| score | INT | 0–100 |
| feedback | TEXT | |

---

## REST API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login → JWT token |

### Interview
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/interviews/generate | Generate questions from skills |
| POST | /api/interviews/{id}/submit | Submit answers → get evaluation |
| GET | /api/interviews | Get all interviews for logged-in user |
| GET | /api/interviews/{id} | Get specific interview detail |

### User / Profile
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/users/me | Get current user profile |
| PUT | /api/users/me/skills | Update skills |

---

## Tech Stack Details

- **Backend**: Java 17, Spring Boot 3.x, Spring Security 6, JWT (jjwt), Spring Data JPA, MySQL 8
- **Frontend**: React 18 + Vite, plain CSS (no Tailwind), Axios, React Router v6
- **AI**: OpenAI `gpt-4o-mini` via REST (`spring-ai` or direct HTTP call)
- **Build**: Maven (backend), npm/vite (frontend)

---

## Key Implementation Decisions

> [!IMPORTANT]
> The OpenAI API key must be provided in `backend/src/main/resources/application.properties` as `openai.api.key=YOUR_KEY`. A placeholder is included; the app gracefully falls back to dummy questions/evaluations when the key is absent.

> [!NOTE]
> The frontend is a separate React app. Both run independently — backend on **port 8080**, frontend on **port 5173**. CORS is configured to allow `http://localhost:5173`.

> [!NOTE]
> A **demo user** is seeded automatically on first startup:
> - Email: `demo@hirelens.ai`  Password: `demo1234`

---

## Proposed Files

### Backend
#### [NEW] pom.xml  
#### [NEW] application.properties  
#### [NEW] HireLensApplication.java  
#### [NEW] config/SecurityConfig.java  
#### [NEW] config/CorsConfig.java  
#### [NEW] config/JwtUtil.java  
#### [NEW] config/OpenAiConfig.java  
#### [NEW] model/User.java  
#### [NEW] model/Interview.java  
#### [NEW] model/Question.java  
#### [NEW] model/Answer.java  
#### [NEW] repository/UserRepository.java  
#### [NEW] repository/InterviewRepository.java  
#### [NEW] repository/QuestionRepository.java  
#### [NEW] repository/AnswerRepository.java  
#### [NEW] dto/* (various DTOs)  
#### [NEW] service/AuthService.java  
#### [NEW] service/InterviewService.java  
#### [NEW] service/AiService.java  
#### [NEW] service/UserService.java  
#### [NEW] controller/AuthController.java  
#### [NEW] controller/InterviewController.java  
#### [NEW] controller/UserController.java  
#### [NEW] exception/GlobalExceptionHandler.java  
#### [NEW] DataInitializer.java (seeds demo user)  

### Frontend
#### [NEW] package.json + vite.config.js  
#### [NEW] index.html  
#### [NEW] src/main.jsx  
#### [NEW] src/App.jsx  
#### [NEW] src/index.css  
#### [NEW] src/context/AuthContext.jsx  
#### [NEW] src/services/api.js  
#### [NEW] src/pages/LoginPage.jsx  
#### [NEW] src/pages/RegisterPage.jsx  
#### [NEW] src/pages/DashboardPage.jsx  
#### [NEW] src/pages/InterviewPage.jsx  
#### [NEW] src/pages/MockInterviewPage.jsx  
#### [NEW] src/pages/ResultPage.jsx  
#### [NEW] src/components/Navbar.jsx  
#### [NEW] src/components/QuestionCard.jsx  
#### [NEW] src/components/ScoreCard.jsx  
#### [NEW] src/components/SkillsInput.jsx  

---

## Verification Plan

### Automated
- `mvn clean package -DskipTests` — backend compiles cleanly
- `npm run build` — frontend compiles cleanly

### Manual
- Register → login → generate questions → answer → get score
- Dashboard shows past interviews
- Mock interview mode with timer
- Demo user credentials work on first boot
