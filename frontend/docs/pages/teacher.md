# Teacher Pages

All teacher pages require the `TEACHER` role.

---

## TeacherHome

**Route:** `/teacher`
**File:** `src/pages/Teacher/TeacherHome.jsx`

Dashboard. Renders `<Layout>` + `<WelcomeBanner>`.

WelcomeBanner quick-action cards for teachers: Schedule, School, Grades, Absences, Complaints.

---

## TeacherSchool

**Route:** `/teacher/school`
**File:** `src/pages/Teacher/TeacherSchool.jsx`

Read-only view of the teacher's school info and daily schedule.

### API calls

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/profile` | Get the teacher's schoolId |
| GET | `/api/schools/{schoolId}` | School details (name, address, type, headmaster) |
| GET | `/api/schools/{schoolId}/schedule` | Daily schedule entries |

### Display

**School info table:** Name, Address, Type, Headmaster.

**Daily schedule list:** Entries sorted by start time, each showing:
- Type chip (LECTURE / BREAK / SPECIAL_EVENT) with color
- Label and time range

---

## TeacherSchedule

**Route:** `/teacher/teacherSchedule/:teacherId`
**File:** `src/pages/Teacher/TeacherSchedule.jsx`

Displays the teacher's active schedule for the current school term.

### API calls

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/schedules/teacher/me` | Teacher's schedule entries |
| GET | `/api/profile` | Get schoolId for term config |
| GET | `/api/schools/{schoolId}/term-config` | Term dates |

### Term awareness

The component determines the **active term** by comparing today's date against the school's configured term dates, taking into account the school's grade levels (elementary ends earlier than gymnasium). Schedule entries for the inactive term are hidden.

Active term is shown as a green chip badge.

### Table columns

| Column | Description |
|---|---|
| Day | Monday–Friday |
| Time | Start–End |
| Subject | Subject name |
| Class | Class name (clickable — navigates to `/schedule/{classId}`) |
| Type | STANDARD / SIP / EXTRACURRICULAR chip |

Rows are sorted by day of week, then start time. Active-term rows are highlighted green.
