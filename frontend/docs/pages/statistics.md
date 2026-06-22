# Statistics Pages

---

## SchoolStatistics

**Route:** `/statistics/school/:schoolId`
**File:** `src/pages/Statistics/SchoolStatistics.jsx`
**Roles:** ADMIN, HEADMASTER

Comprehensive analytics dashboard for a single school.

### API calls

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/schools/{schoolId}` | School details |
| GET | `/api/classes` | All classes (filtered by schoolId client-side) |
| GET | `/api/users/teachers/school/{schoolId}` | Teacher list |
| GET | `/api/users/students/school/{schoolId}` | Student list |
| GET | `/api/grades/class/{classId}` | Grades for each class (parallel) |
| GET | `/api/absences/class/{classId}` | Absences for each class (parallel) |

All per-class fetches run in parallel via `Promise.all`.

### Sections

**Overview KPIs:**
Student count, Teacher count, Class count, Profile count, Total grades, Total absences, School average grade.

**Term filter:**
Tabs — All / Term 1 / Term 2. Filters all subsequent sections.

**Risk Indicators:**
- Classes with average grade below 4.0
- Subjects with fail rate above 30%
- Shown as warning chips; "No concerns detected." if clean.

**Class Breakdown table:**
Columns: Class · Grades given · Average (chip) · Pass rate · Absences (excused + unexcused) · Excused rate

**Grade Statistics:**
- Distribution bar (Excellent / Very Good / Good / Satisfactory / Fail)
- Subject average table
- Teacher breakdown table (which teacher gave how many grades and at what average)

**Student Highlights:**
- Top 5 students by average grade
- Top 5 most absent students

**Absence Statistics:**
- By class (bar-style list)
- By subject

### Grade color coding

| Value | Color |
|---|---|
| ≥ 5.50 | success (green) |
| ≥ 5.00 | primary (blue) |
| ≥ 4.00 | warning (orange) |
| < 4.00 | error (red) |

---

## TeacherStatistics

**Route:** `/statistics/teacher/me` (self) or `/statistics/teacher/:teacherId`
**File:** `src/pages/Statistics/TeacherStatistics.jsx`
**Roles:** TEACHER (self), ADMIN + HEADMASTER (any teacher)

Analytics for a single teacher based on grades they have entered.

### API calls

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/schedules/teacher/me` or `/api/schedules/teacher/{teacherId}` | Teacher's schedule (to know which classes/subjects they teach) |
| GET | `/api/grades/class/{classId}` | Grades for each class (parallel) |

The component only considers grades for subjects the teacher actually teaches in each class (filtered by `teacherSubjectsByClass` map built from the schedule).

### Tabs

**By Class:**
Table — Class · Grades given · Average grade (chip) · Pass rate

**By Subject:**
Table — Subject · Grades given · Average grade (chip) · Pass rate

**By Student:**
Table — Class · Student · Overall average (chip) · Per-subject breakdown (small chips)

### Title logic

- `/statistics/teacher/me` → "My Statistics"
- `/statistics/teacher/:teacherId` → "Statistics of user" (teacher's name could be added)

---

## SubjectStatistics

**Route:** `/statistics/subject/:subjectId`
**File:** `src/pages/Statistics/SubjectStatistics.jsx`
**Roles:** ADMIN, HEADMASTER

> **Not yet implemented.** Currently renders a placeholder `<div>SubjectStatistics</div>`.

---

## Selection Pages

Selection pages act as intermediary screens where the user picks an entity before navigating to a statistics or data page. They all follow the same pattern: fetch list → render cards → click → navigate.

### SelectSchoolForStatistics

**Route:** `/select/school/statistics`
**Role:** ADMIN

Fetches `GET /api/schools`. Displays school cards (name, type chip, headmaster name).
Click → `/statistics/school/{id}`

---

### SelectTeacherForStatistics

**Route:** `/select/teacher/statistics`
**Roles:** ADMIN, HEADMASTER

Fetches `GET /api/users` (filter to TEACHER role) and `GET /api/schools`.
Displays teacher cards with avatar, name, school name.
School filter dropdown to narrow results.
Click → `/statistics/teacher/{id}`

---

### SelectSubjectForStatistics

**Route:** `/select/subject/statistics`
**Roles:** ADMIN, HEADMASTER

Fetches `GET /api/subjects`.
Click → `/statistics/subject/{id}`

---

### SelectClassForScheduleView

**Route:** `/select/class/schedule`
**Roles:** ADMIN, HEADMASTER

Fetches classes. Click → `/schedule/{classId}`

---

### SelectClassForGradesView

**Route:** `/select/class/grades`
**Roles:** ADMIN, HEADMASTER, TEACHER

Fetches classes available to the user. Click → `/grades/class/{classId}`

---

### SelectClassForAbsencesView

**Route:** `/select/class/absences`
**Roles:** ADMIN, HEADMASTER, TEACHER

Click → `/absences/class/{classId}`

---

### SelectClassForComplaintsView

**Route:** `/select/class/complaints`
**Roles:** ADMIN, TEACHER

Click → `/complaints/class/{classId}`
