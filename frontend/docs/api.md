# API Reference

All requests go through `src/api/axiosInstance.js`:
- `baseURL` = `VITE_BACKEND_BASE_URL` (e.g. `http://localhost:5000`)
- `withCredentials: true` — sends the HttpOnly refresh token cookie automatically

The `Authorization: Bearer <token>` header is injected by `AuthProvider` after every successful login or token refresh.

---

## Authentication

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | Login, returns `{ accessToken }` |
| POST | `/auth/logout` | — | Invalidates refresh token cookie |
| POST | `/auth/refresh` | — | Issues new access token using cookie |

---

## Users

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | All users (ADMIN) |
| POST | `/api/users` | Create user (ADMIN) |
| PUT | `/api/users/{id}` | Update user (ADMIN) |
| DELETE | `/api/users/{id}` | Delete user (ADMIN) |
| GET | `/api/users/{id}/picture` | User avatar (blob) |
| GET | `/api/users/teachers/school/{schoolId}` | Teachers at a school |
| GET | `/api/users/students/school/{schoolId}` | Students at a school |
| GET | `/api/users/headmasters` | All headmasters |
| GET | `/api/profile` | Current user's profile |
| PUT | `/api/profile/picture` | Upload avatar |
| DELETE | `/api/profile/picture` | Remove avatar |
| PUT | `/api/profile/bio` | Update bio |
| PUT | `/api/profile/password` | Change password |

---

## Schools

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/schools` | All schools |
| POST | `/api/schools` | Create school (ADMIN) |
| GET | `/api/schools/{id}` | School by ID |
| PUT | `/api/schools/{id}` | Update school (ADMIN) |
| DELETE | `/api/schools/{id}` | Delete school (ADMIN) |
| PATCH | `/api/schools/{id}/info` | Update name/address (HEADMASTER) |
| PUT | `/api/schools/{id}/term-config` | Save term dates |
| GET | `/api/schools/{id}/term-config` | Fetch term dates |
| PUT | `/api/schools/{id}/student-limit` | Set enrollment cap |
| GET | `/api/schools/{id}/schedule` | Daily schedule entries |
| POST | `/api/schools/{id}/schedule` | Add schedule entry |
| PUT | `/api/schools/schedule/{entryId}` | Edit schedule entry |
| DELETE | `/api/schools/schedule/{entryId}` | Delete schedule entry |
| GET | `/api/schools/{id}/profiles` | School profiles |
| POST | `/api/schools/{id}/profiles` | Add profile |
| DELETE | `/api/schools/profiles/{profileId}` | Remove profile |

---

## Classes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/classes` | All classes (filtered by role) |
| GET | `/api/classes/school/{schoolId}` | Classes at a school |
| GET | `/api/classes/{id}` | Class by ID |
| GET | `/api/classes/{id}/students` | Students in a class |

---

## Subjects

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/subjects` | All subjects |
| POST | `/api/subjects` | Create subject (ADMIN) |
| PUT | `/api/subjects/{id}` | Update subject (ADMIN) |
| DELETE | `/api/subjects/{id}` | Delete subject (ADMIN) |

---

## Teachers

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/teachers/school/{schoolId}` | Teachers at a school |
| POST | `/api/teachers/create-and-hire` | Create user + hire as teacher |
| DELETE | `/api/teachers/{teacherId}/fire` | Remove teacher from school |
| PUT | `/api/teachers/{teacherId}/salary` | Set salary |
| PUT | `/api/teachers/{teacherId}/qualifications` | Set subject qualifications |

---

## Students

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/students/available` | Unenrolled student-role users |
| GET | `/api/students/capacity` | `{ current, limit }` for headmaster's school |
| POST | `/api/students/{userId}/enroll` | Enroll existing user |
| POST | `/api/students/create-and-enroll` | Create user + enroll |
| DELETE | `/api/students/{studentId}/expel` | Expel student |

---

## Parents

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/parents/school/{schoolId}` | Parents at a school |
| GET | `/api/parents/available` | Parents not yet linked to a student |
| POST | `/api/parents` | Create parent account |
| PUT | `/api/parents/{parentId}` | Edit parent |
| POST | `/api/parents/{parentId}/link/{studentId}` | Link parent ↔ student |
| DELETE | `/api/parents/{parentId}/unlink/{studentId}` | Remove link |
| GET | `/parent/students` | Children of current parent user |

---

## Schedules

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/schedules/class/{classId}` | Schedule for a class |
| GET | `/api/schedules/teacher/me` | Current teacher's schedule |
| GET | `/api/schedules/teacher/{teacherId}` | Teacher's schedule by ID |
| POST | `/api/schedules` | Create schedule entry |
| PATCH | `/api/schedules/{id}/type` | Change lecture type |
| DELETE | `/api/schedules/{id}` | Delete entry |

---

## Grades

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/grades` | All grades (ADMIN) |
| GET | `/api/grades/student/me` | Current student's grades |
| GET | `/api/grades/student/{studentId}` | Student grades by ID |
| GET | `/api/grades/class/{classId}` | Grades for a class |
| GET | `/api/grades/school/{schoolId}` | Grades for a school |
| POST | `/api/grades` | Add grade (TEACHER) |
| DELETE | `/api/grades/{id}` | Remove grade |

---

## Absences

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/absences` | All absences (ADMIN) |
| GET | `/api/absences/student/me` | Current student's absences |
| GET | `/api/absences/student/{studentId}` | Student absences by ID |
| GET | `/api/absences/class/{classId}` | Absences for a class |
| GET | `/api/absences/school/{schoolId}` | Absences for a school |
| POST | `/api/absences` | Record absence (TEACHER) |
| PATCH | `/api/absences/{id}/excuse` | Mark as excused |
| DELETE | `/api/absences/{id}` | Remove absence |

---

## Complaints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/complaints` | All complaints (ADMIN) |
| GET | `/api/complaints/student/{studentId}` | Complaints for student |
| GET | `/api/complaints/class/{classId}` | Complaints for class |
| GET | `/api/complaints/school/{schoolId}` | Complaints for school |
| POST | `/api/complaints` | File complaint (TEACHER) |
| DELETE | `/api/complaints/{id}` | Remove complaint |

---

## Events / Calendar

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/events/student/me` | Calendar events for current student |
