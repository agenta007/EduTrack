# EduTrack — Technical Documentation

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Layers](#2-architecture--layers)
3. [JWT Authentication Flow](#3-jwt-authentication-flow)
4. [Security Configuration](#4-security-configuration)
5. [Role System](#5-role-system)
6. [REST API Reference](#6-rest-api-reference)
7. [Frontend Routing](#7-frontend-routing)
8. [Request Lifecycle](#8-request-lifecycle)
9. [Configuration Reference](#9-configuration-reference)

---

## 1. Project Overview

EduTrack is a full-stack school management system (e-journal) designed for the Bulgarian education system. It supports multiple schools, each with its own headmaster, teachers, students, and parents. Data is organised by class, subject, term, and school year.

**Tech stack:**

| Layer      | Technology                                                 |
|------------|------------------------------------------------------------|
| Backend    | Java 25, Spring Boot 3.5, Spring Security, Spring Data JPA |
| Database   | PostgreSQL                                                 |
| Auth       | JWT (JJWT 0.12), HttpOnly refresh-token cookie             |
| Frontend   | React 18, Vite, Material UI, React Router, i18next         |
| API docs   | SpringDoc OpenAPI (Swagger UI at `/swagger-ui.html`)       |

---

## 2. Architecture & Layers

```
┌──────────────────────────────────────────┐
│               React Frontend             │  :5173  (dev)
│  React Router · MUI · i18next · Axios    │
└───────────────────┬──────────────────────┘
                    │ HTTP/JSON  (proxied to :8080 in dev)
┌───────────────────▼──────────────────────┐
│           Spring Boot Backend            │  :8080
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │         Filter Chain                │ │
│  │  RequestLoggingFilter               │ │
│  │  LocalhostAdminFilter  (dev only)   │ │
│  │  JwtAuthenticationFilter            │ │
│  └──────────────┬──────────────────────┘ │
│                 │                         │
│  ┌──────────────▼──────────────────────┐ │
│  │         Controllers (@RestController)│ │
│  │  /auth  /api/schools  /api/grades   │ │
│  │  /api/users  /api/schedules  ...    │ │
│  └──────────────┬──────────────────────┘ │
│                 │                         │
│  ┌──────────────▼──────────────────────┐ │
│  │         Services (@Service)         │ │
│  │  Business logic, auth checks,       │ │
│  │  DTO mapping                        │ │
│  └──────────────┬──────────────────────┘ │
│                 │                         │
│  ┌──────────────▼──────────────────────┐ │
│  │    Repositories (Spring Data JPA)   │ │
│  │    JPA entities → PostgreSQL        │ │
│  └─────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

### Package layout

```
com.edutrack.e_journal
├── config/          SecurityConfig, OpenApiConfig
├── controller/      One controller per domain
├── dto/             Request/response objects (Lombok records)
├── entity/          JPA entities (Lombok @Data / @Builder)
├── repository/      Spring Data JPA interfaces
├── security/        JWT utilities, filters, UserDetailsService
└── service/         Business logic
```

---

## 3. JWT Authentication Flow

### Login

```
Client                         Backend
  │                              │
  │  POST /auth/login            │
  │  { email, password }         │
  │─────────────────────────────▶│
  │                              │  AuthenticationManager.authenticate()
  │                              │  BCrypt password check
  │                              │  generateAccessToken()  → 24 h
  │                              │  generateRefreshToken() → 7 days
  │                              │  Set-Cookie: refreshToken (HttpOnly, path=/auth)
  │◀─────────────────────────────│
  │  { accessToken: "eyJ..." }   │
```

### Authenticated request

```
Client                         Backend
  │                              │
  │  GET /api/profile            │
  │  Authorization: Bearer eyJ…  │
  │─────────────────────────────▶│
  │                              │  JwtAuthenticationFilter:
  │                              │   1. Extract header
  │                              │   2. validateToken() — signature + expiry
  │                              │   3. getEmailFromToken()
  │                              │   4. CustomUserDetailsService.loadUserByUsername()
  │                              │   5. Set SecurityContext
  │                              │  Controller / @PreAuthorize check
  │◀─────────────────────────────│
  │  200 { profile data }        │
```

### Token refresh

```
Client                         Backend
  │                              │
  │  POST /auth/refresh          │
  │  Cookie: refreshToken=eyJ…   │
  │─────────────────────────────▶│
  │                              │  Read cookie → validate → extract email
  │                              │  Load user → generateAccessToken()
  │◀─────────────────────────────│
  │  { accessToken: "eyJ..." }   │
```

### Access token claims

| Claim | Value                                         |
|-------|-----------------------------------------------|
| `sub` | User's email address                          |
| `id`  | User's database primary key (Long)            |
| `email` | User's email address                        |
| `role` | Role enum name: ADMIN / HEADMASTER / TEACHER / STUDENT / PARENT |
| `name` | `firstName + " " + lastName`                |
| `iat` | Issued-at timestamp (epoch seconds)           |
| `exp` | Expiry timestamp — `iat + jwtExpirationInMs`  |

Refresh token contains only `sub` + `iat` + `exp` (7 days).

### Frontend token handling

- Access token is stored in `localStorage` and attached to every request via an Axios request interceptor.
- On 401 response the interceptor calls `POST /auth/refresh` using the HttpOnly cookie, updates the stored token, and retries the original request.
- On logout or refresh failure, `localStorage` is cleared and the user is redirected to `/login`.

---

## 4. Security Configuration

### Filter chain order

1. **RequestLoggingFilter** — logs every request (method, path, status, duration, IP) to `requests.log`.
2. **LocalhostAdminFilter** — _development only_ (`app.security.allow-localhost=true`). Any request from `127.0.0.1` / `::1` that has no `Authorization` header is automatically authenticated with all five roles. **Must be disabled in production.**
3. **JwtAuthenticationFilter** — validates Bearer token and populates `SecurityContext`.
4. Standard Spring Security filters.

### Public endpoints (no authentication required)

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET  /swagger-ui/**`, `/swagger-ui.html`, `/v3/api-docs/**`

All other paths require a valid JWT.

### CORS

Allowed origin: `http://localhost:5173` (Vite dev server).
Methods: GET, POST, PUT, DELETE, OPTIONS.
Credentials: enabled (needed for the refresh-token cookie).

> For production, update `corsConfigurationSource()` in `SecurityConfig` to allow the real frontend domain.

---

## 5. Role System

| Role        | Description                                              |
|-------------|----------------------------------------------------------|
| `ADMIN`     | Global superuser. Full access to all schools and data.   |
| `HEADMASTER`| Manages one school. Hires/fires staff, configures terms. |
| `TEACHER`   | Records grades, absences, complaints for assigned classes.|
| `STUDENT`   | Read-only access to own grades, absences, complaints.    |
| `PARENT`    | Read-only access to their child's data.                  |

Role is enforced at two levels:

1. **Method-level** — `@PreAuthorize("hasRole('ADMIN') or hasRole('HEADMASTER')")` on controller methods.
2. **Service-level** — ownership checks (e.g. a HEADMASTER may only modify their own school).

---

## 6. REST API Reference

Base URL: `http://localhost:8080`

---

### Authentication — `/auth`

| Method | Path            | Description                             | Auth |
|--------|-----------------|-----------------------------------------|------|
| POST   | `/auth/login`   | Login with email + password. Returns access token; sets refresh cookie. | Public |
| POST   | `/auth/refresh` | Exchange refresh cookie for new access token. | Public (cookie) |
| POST   | `/auth/logout`  | Clear refresh cookie.                   | Public |

**LoginRequest:** `{ email, password }`
**AuthResponse:** `{ accessToken }`

---

### Profile — `/api/profile`

| Method | Path                     | Description                          | Roles        |
|--------|--------------------------|--------------------------------------|--------------|
| GET    | `/api/profile`           | Get own full profile + school info   | All authenticated |
| PUT    | `/api/profile/password`  | Change own password (requires current password) | All authenticated |
| PUT    | `/api/profile/picture`   | Upload profile picture (multipart)   | All authenticated |
| DELETE | `/api/profile/picture`   | Remove profile picture               | All authenticated |
| PUT    | `/api/profile/bio`       | Set or clear bio text (max 500 chars)| All authenticated |

---

### Schools — `/api/schools`

| Method | Path                                   | Description                              | Roles                   |
|--------|----------------------------------------|------------------------------------------|-------------------------|
| GET    | `/api/schools`                         | List all schools                         | ADMIN                   |
| GET    | `/api/schools/{id}`                    | Get school by ID                         | ADMIN, HEADMASTER, TEACHER |
| POST   | `/api/schools`                         | Create school                            | ADMIN                   |
| PUT    | `/api/schools/{id}`                    | Full update (name, address, type, headmaster) | ADMIN              |
| PATCH  | `/api/schools/{id}/info`               | Update name / address only               | ADMIN, HEADMASTER       |
| DELETE | `/api/schools/{id}`                    | Delete school                            | ADMIN                   |
| GET    | `/api/schools/{schoolId}/profiles`     | List specialisation profiles             | ADMIN, HEADMASTER, TEACHER |
| POST   | `/api/schools/{schoolId}/profiles`     | Add specialisation profile               | ADMIN                   |
| DELETE | `/api/schools/profiles/{profileId}`    | Remove specialisation profile            | ADMIN                   |
| GET    | `/api/schools/{schoolId}/schedule`     | Get ordered daily bell schedule          | ADMIN, HEADMASTER, TEACHER |
| POST   | `/api/schools/{schoolId}/schedule`     | Add bell-schedule entry                  | ADMIN, HEADMASTER       |
| PUT    | `/api/schools/schedule/{entryId}`      | Update bell-schedule entry               | ADMIN, HEADMASTER       |
| DELETE | `/api/schools/schedule/{entryId}`      | Delete bell-schedule entry               | ADMIN, HEADMASTER       |
| GET    | `/api/schools/{schoolId}/term-config`  | Get term date configuration              | ADMIN, HEADMASTER, TEACHER |
| PUT    | `/api/schools/{schoolId}/term-config`  | Set term date configuration              | ADMIN, HEADMASTER       |
| PUT    | `/api/schools/{schoolId}/student-limit`| Set maximum student count                | ADMIN, HEADMASTER       |

> HEADMASTER endpoints always verify the school belongs to the authenticated headmaster.

---

### Users — `/api/users`

| Method | Path                                      | Description                            | Roles           |
|--------|-------------------------------------------|----------------------------------------|-----------------|
| GET    | `/api/users`                              | List all users                         | ADMIN           |
| GET    | `/api/users/teachers/school/{schoolId}`   | Teachers at school (id + name)         | ADMIN, HEADMASTER |
| GET    | `/api/users/students/school/{schoolId}`   | Students at school (full profiles)     | ADMIN, HEADMASTER |
| GET    | `/api/users/parents/school/{schoolId}`    | Parents at school                      | ADMIN, HEADMASTER |
| GET    | `/api/users/headmasters`                  | All headmasters (id + name)            | ADMIN           |
| GET    | `/api/users/{id}/picture`                 | Raw profile picture bytes              | Public          |
| POST   | `/api/users`                              | Create user account                    | ADMIN           |
| PUT    | `/api/users/{id}`                         | Update user (name, email, role, password) | ADMIN        |
| DELETE | `/api/users/{id}`                         | Delete user                            | ADMIN           |

---

### Teachers — `/api/teachers`

| Method | Path                                        | Description                              | Roles      |
|--------|---------------------------------------------|------------------------------------------|------------|
| GET    | `/api/teachers/school/{schoolId}`           | Teachers at school (salary, qualifications) | ADMIN, HEADMASTER |
| GET    | `/api/teachers/available`                   | Users with TEACHER role not yet hired    | HEADMASTER |
| POST   | `/api/teachers/create-and-hire`             | Create user + hire in one step           | HEADMASTER |
| POST   | `/api/teachers/{userId}/hire`               | Hire existing user as teacher            | HEADMASTER |
| DELETE | `/api/teachers/{teacherId}/fire`            | Remove teacher from school               | HEADMASTER |
| PUT    | `/api/teachers/{teacherId}/salary`          | Set monthly salary                       | HEADMASTER |
| PUT    | `/api/teachers/{teacherId}/qualifications`  | Set subject qualifications               | HEADMASTER |

---

### Students — `/api/students`

| Method | Path                                   | Description                              | Roles      |
|--------|----------------------------------------|------------------------------------------|------------|
| GET    | `/api/students/available`              | STUDENT-role users not yet enrolled      | HEADMASTER |
| POST   | `/api/students/{userId}/enroll`        | Enroll student in headmaster's school    | HEADMASTER |
| DELETE | `/api/students/{studentId}/expel`      | Expel student from school                | HEADMASTER |

---

### Parents — `/api/parents`

| Method | Path                                          | Description                        | Roles      |
|--------|-----------------------------------------------|------------------------------------|------------|
| GET    | `/api/parents/school/{schoolId}`              | Parents at school                  | ADMIN, HEADMASTER |
| GET    | `/api/parents/available`                      | All PARENT-role users              | HEADMASTER |
| POST   | `/api/parents/{parentId}/link/{studentId}`    | Link parent to student             | HEADMASTER |
| DELETE | `/api/parents/{parentId}/unlink/{studentId}`  | Unlink parent from student         | HEADMASTER |
| PUT    | `/api/parents/{parentId}`                     | Update parent name / email         | HEADMASTER |

---

### Classes — `/api/classes`

| Method | Path                          | Description                       | Roles                              |
|--------|-------------------------------|-----------------------------------|------------------------------------|
| GET    | `/api/classes`                | List all classes                  | ADMIN, HEADMASTER, TEACHER         |
| GET    | `/api/classes/school/{schoolId}` | Classes at school              | ADMIN, HEADMASTER                  |
| GET    | `/api/classes/{id}`           | Get class details                 | ADMIN, HEADMASTER, TEACHER, PARENT, STUDENT |
| GET    | `/api/classes/{id}/students`  | Students in class (id + name)     | ADMIN, HEADMASTER, TEACHER         |

---

### Schedules (curriculum) — `/api/schedules`

Each schedule entry represents one subject taught by one teacher to one class on a given day of week in a given term.

| Method | Path                              | Description                           | Roles                               |
|--------|-----------------------------------|---------------------------------------|-------------------------------------|
| GET    | `/api/schedules/class/{classId}`  | Curriculum entries for class          | ADMIN, HEADMASTER, TEACHER, PARENT, STUDENT |
| GET    | `/api/schedules/teacher/{teacherId}` | Curriculum entries for teacher     | ADMIN, HEADMASTER                   |
| GET    | `/api/schedules/teacher/me`       | Own curriculum entries                | TEACHER                             |
| POST   | `/api/schedules`                  | Add curriculum entry                  | ADMIN, HEADMASTER                   |
| PATCH  | `/api/schedules/{id}/type`        | Change lecture type (STANDARD / SIP / EXTRACURRICULAR) | ADMIN, HEADMASTER |
| DELETE | `/api/schedules/{id}`             | Remove curriculum entry               | ADMIN, HEADMASTER                   |

---

### Grades — `/api/grades`

Bulgarian grading scale: 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6.

| Method | Path                              | Description                    | Roles                              |
|--------|-----------------------------------|--------------------------------|------------------------------------|
| GET    | `/api/grades/class/{classId}`     | All grades for a class         | ADMIN, HEADMASTER, TEACHER         |
| GET    | `/api/grades/student/me`          | Own grades                     | STUDENT                            |
| GET    | `/api/grades/student/{studentId}` | Grades for a specific student  | ADMIN, HEADMASTER, TEACHER, PARENT |
| POST   | `/api/grades`                     | Add grade                      | ADMIN, HEADMASTER, TEACHER         |
| DELETE | `/api/grades/{id}`                | Remove grade                   | ADMIN, HEADMASTER, TEACHER         |

---

### Absences — `/api/absences`

| Method | Path                                  | Description                     | Roles                              |
|--------|---------------------------------------|---------------------------------|------------------------------------|
| GET    | `/api/absences/class/{classId}`       | All absences for a class        | ADMIN, HEADMASTER, TEACHER         |
| GET    | `/api/absences/student/me`            | Own absences                    | STUDENT                            |
| GET    | `/api/absences/student/{studentId}`   | Absences for a specific student | ADMIN, HEADMASTER, TEACHER, PARENT |
| POST   | `/api/absences`                       | Record absence                  | ADMIN, HEADMASTER, TEACHER         |
| PUT    | `/api/absences/{id}/excuse`           | Toggle excused/unexcused        | ADMIN, HEADMASTER, TEACHER         |
| DELETE | `/api/absences/{id}`                  | Delete absence record           | ADMIN, HEADMASTER, TEACHER         |

---

### Complaints — `/api/complaints`

| Method | Path                                    | Description                       | Roles                              |
|--------|-----------------------------------------|-----------------------------------|------------------------------------|
| GET    | `/api/complaints/class/{classId}`       | All complaints for a class        | ADMIN, HEADMASTER, TEACHER         |
| GET    | `/api/complaints/student/me`            | Own complaints                    | STUDENT                            |
| GET    | `/api/complaints/student/{studentId}`   | Complaints for a specific student | ADMIN, HEADMASTER, TEACHER, PARENT |
| POST   | `/api/complaints`                       | File complaint                    | ADMIN, HEADMASTER, TEACHER         |
| DELETE | `/api/complaints/{id}`                  | Delete complaint                  | ADMIN, HEADMASTER, TEACHER         |

---

### Subjects — `/api/subjects`

| Method | Path                 | Description        | Roles           |
|--------|----------------------|--------------------|-----------------|
| GET    | `/api/subjects`      | List all subjects  | ADMIN, HEADMASTER |
| POST   | `/api/subjects`      | Create subject     | ADMIN           |
| PUT    | `/api/subjects/{id}` | Rename subject     | ADMIN           |
| DELETE | `/api/subjects/{id}` | Delete subject     | ADMIN           |

---

## 7. Frontend Routing

### Authentication & redirect

On app load, `AuthProvider` reads the stored access token from `localStorage` and decodes its claims (id, email, role, name) to populate the auth context. Every protected route is wrapped in `ProtectedRoute` which redirects to `/login` if unauthenticated or `/unauthorized` if the user's role is not in the allowed list.

The root path `/` renders `RoleRedirect`, which immediately sends the user to their role's home page:

| Role        | Redirect target   |
|-------------|-------------------|
| ADMIN       | `/admin`          |
| HEADMASTER  | `/headmaster`     |
| TEACHER     | `/teacher`        |
| STUDENT     | `/student`        |
| PARENT      | `/parent`         |

### Route table

#### Public
| Path             | Component     |
|------------------|---------------|
| `/login`         | Login         |
| `/unauthorized`  | Unauthorized  |

#### Profile (all authenticated roles)
| Path       | Component |
|------------|-----------|
| `/profile` | Profile   |

#### Admin
| Path                  | Component        |
|-----------------------|------------------|
| `/admin`              | AdminHome        |
| `/admin/manageUsers`  | AdminManageUsers |
| `/admin/viewSchools`  | ViewSchools      |
| `/admin/viewSubjects` | ViewSubjects     |

#### Headmaster
| Path                        | Component       |
|-----------------------------|-----------------|
| `/headmaster`               | HeadmasterHome  |
| `/headmaster/mySchool`      | HeadmasterSchool|
| `/headmaster/viewParents`   | ViewParents     |
| `/headmaster/viewStudents`  | ViewStudents    |
| `/headmaster/viewTeachers`  | ViewTeachers    |

#### Teacher
| Path                                  | Component       |
|---------------------------------------|-----------------|
| `/teacher`                            | TeacherHome     |
| `/teacher/school`                     | TeacherSchool   |
| `/teacher/teacherSchedule/:teacherId` | TeacherSchedule |

#### Student
| Path       | Component   |
|------------|-------------|
| `/student` | StudentHome |

#### Parent
| Path      | Component  |
|-----------|------------|
| `/parent` | ParentHome |

#### Shared — Schedule
| Path                    | Allowed roles                           |
|-------------------------|-----------------------------------------|
| `/schedule/:classId`    | ADMIN, HEADMASTER, TEACHER, PARENT, STUDENT |

#### Shared — Grades
| Path                          | Allowed roles                           |
|-------------------------------|-----------------------------------------|
| `/grades`                     | ADMIN                                   |
| `/grades/school/:schoolId`    | ADMIN, HEADMASTER                       |
| `/grades/class/:classId`      | ADMIN, HEADMASTER, TEACHER              |
| `/grades/student/:studentId`  | ADMIN, HEADMASTER, TEACHER, PARENT, STUDENT |
| `/grades/me`                  | STUDENT                                 |

#### Shared — Absences
| Path                            | Allowed roles                           |
|---------------------------------|-----------------------------------------|
| `/absences`                     | ADMIN                                   |
| `/absences/school/:schoolId`    | ADMIN, HEADMASTER                       |
| `/absences/class/:classId`      | ADMIN, HEADMASTER, TEACHER              |
| `/absences/student/:studentId`  | ADMIN, HEADMASTER, TEACHER, PARENT, STUDENT |
| `/absences/me`                  | STUDENT                                 |

#### Shared — Complaints
| Path                              | Allowed roles                           |
|-----------------------------------|-----------------------------------------|
| `/complaints`                     | ADMIN                                   |
| `/complaints/school/:schoolId`    | ADMIN, HEADMASTER                       |
| `/complaints/class/:classId`      | ADMIN, HEADMASTER, TEACHER              |
| `/complaints/student/:studentId`  | ADMIN, HEADMASTER, TEACHER, PARENT, STUDENT |

#### Statistics
| Path                               | Allowed roles     |
|------------------------------------|-------------------|
| `/statistics/school/:schoolId`     | ADMIN, HEADMASTER |
| `/statistics/subject/:subjectId`   | ADMIN, HEADMASTER |
| `/statistics/teacher/:teacherId`   | ADMIN, HEADMASTER |

#### Selection helpers (picker pages before navigating to a detail view)
| Path                           | Allowed roles             | Purpose                      |
|--------------------------------|---------------------------|------------------------------|
| `/select/school/statistics`    | ADMIN                     | Pick school for statistics   |
| `/select/teacher/statistics`   | ADMIN, HEADMASTER         | Pick teacher for statistics  |
| `/select/subject/statistics`   | ADMIN, HEADMASTER         | Pick subject for statistics  |
| `/select/class/schedule`       | ADMIN, HEADMASTER         | Pick class for schedule      |
| `/select/class/grades`         | ADMIN, HEADMASTER, TEACHER| Pick class for grades        |
| `/select/class/absences`       | ADMIN, HEADMASTER, TEACHER| Pick class for absences      |
| `/select/class/complaints`     | ADMIN, TEACHER            | Pick class for complaints    |

---

## 8. Request Lifecycle

A complete example — a teacher submitting a grade:

```
1. Teacher clicks "Add grade" in the React UI (ClassGrades.jsx)

2. React calls:
   POST /api/grades
   Authorization: Bearer eyJhbGciOiJIUzI1...
   Content-Type: application/json
   { studentId: 42, scheduleId: 7, value: 5.5 }

3. RequestLoggingFilter logs: POST /api/grades → (in progress)

4. LocalhostAdminFilter: request has Authorization header → skip.

5. JwtAuthenticationFilter:
   - Extracts token from header
   - Calls JwtUtils.validateToken() → OK
   - Extracts email from claims
   - Calls CustomUserDetailsService.loadUserByUsername(email)
     → loads User from DB, wraps in UserDetails with role TEACHER
   - Sets SecurityContext with UsernamePasswordAuthenticationToken

6. Spring Security checks @PreAuthorize on GradeController.addGrade():
   hasRole('TEACHER') or hasRole('ADMIN') or hasRole('HEADMASTER') → PASS

7. GradeController.addGrade() delegates to GradeService.addGrade():
   - Validates schedule exists
   - Validates student exists
   - Validates grade value is in allowed set
   - Saves new Grade entity via GradeRepository

8. Response: 201 Created { gradeId, studentId, subjectId, value, term, ... }

9. RequestLoggingFilter completes the log line:
   POST /api/grades → 201 (12ms) [127.0.0.1]

10. React adds the new grade chip to the UI without a page reload.
```

---

## 9. Configuration Reference

File: `backend/e-journal/src/main/resources/application.properties`

```properties
spring.application.name=e-journal

# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/ejournal
spring.datasource.username=ejournal_usr
spring.datasource.password=ejournal_pwd
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA / Hibernate
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.show-sql=false
spring.jpa.hibernate.ddl-auto=update
spring.jpa.open-in-view=true

# JWT
app.jwtSecret=<at-least-64-char-secret>
app.jwtExpirationInMs=86400000   # 24 hours (access token)
                                 # refresh token is always 7 days

# Security
app.security.allow-localhost=true   # set false in production!

# Logging
app.logging.path=logs
logging.config=classpath:logback-spring.xml
```

### Log files (`app.logging.path` directory)

| File             | Contents                                                        | Retention |
|------------------|-----------------------------------------------------------------|-----------|
| `e-journal.log`  | Full application log (INFO+), rotated daily                     | 30 days   |
| `requests.log`   | One line per HTTP request: method, path, status, ms, IP         | 14 days   |

### Production checklist

- Set `app.security.allow-localhost=false`
- Use a random JWT secret of at least 64 characters
- Update CORS allowed origins in `SecurityConfig` to your real domain
- Set `spring.jpa.hibernate.ddl-auto=validate` (never `update` or `create` in production)
- Run as a dedicated low-privilege system user (see systemd service in `configure-debian.sh`)
