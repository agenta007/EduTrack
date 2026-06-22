# Grades, Absences & Complaints

These three domains share the same structural pattern: data exists at four scopes (student → class → school → all schools), and the correct endpoint is chosen based on the route parameters and the logged-in user's role.

---

## Grades

### StudentGrades

**Routes:** `/grades/student/:studentId` · `/grades/me`
**File:** `src/pages/Grades/StudentGrades.jsx`
**Roles:** All (student only sees own via `/grades/me`)

#### API calls

| Condition | Endpoint |
|---|---|
| Route is `/grades/me` | `GET /api/grades/student/me` |
| Route has `:studentId` | `GET /api/grades/student/{studentId}` |

#### Features

- **Term tabs**: All / Term 1 / Term 2 (filters client-side by `term` field)
- **Subject grouping**: Grades grouped by subject, with per-subject average
- **Overall average chip**: Computed across all displayed grades, color-coded
- **Grade table columns**: Date · Subject · Value (chip) · Teacher · Type

**Grade chip colors:**

| Value | Color |
|---|---|
| ≥ 5.50 | success (green) |
| ≥ 4.00 | primary (blue) |
| ≥ 3.00 | warning (orange) |
| < 3.00 | error (red) |

---

### ClassGrades

**Route:** `/grades/class/:classId`
**File:** `src/pages/Grades/ClassGrades.jsx`
**Roles:** ADMIN, HEADMASTER, TEACHER

API: `GET /api/grades/class/{classId}`

Aggregate view for all students in a class. Table rows are individual grades; includes student name column.

---

### SchoolGrades

**Route:** `/grades/school/:schoolId`
**File:** `src/pages/Grades/SchoolGrades.jsx`
**Roles:** ADMIN, HEADMASTER

API: `GET /api/grades/school/{schoolId}`

---

### AllSchoolsGrades

**Route:** `/grades`
**File:** `src/pages/Grades/AllSchoolsGrades.jsx`
**Role:** ADMIN

API: `GET /api/grades`

System-wide view. Typically shows totals/aggregates per school.

---

## Absences

### StudentAbsences

**Routes:** `/absences/student/:studentId` · `/absences/me`
**File:** `src/pages/Absences/StudentAbsences.jsx`
**Roles:** All (student only sees own via `/absences/me`)

#### API calls

| Condition | Endpoint |
|---|---|
| Route is `/absences/me` | `GET /api/absences/student/me` |
| Route has `:studentId` | `GET /api/absences/student/{studentId}` |

#### Features

- **Term tabs**: All / Term 1 / Term 2
- **Summary chips**: Total absences · Excused count · Unexcused count
- **Table columns**: Date · Subject · Excused (chip) · Reason

---

### ClassAbsences

**Route:** `/absences/class/:classId`
**File:** `src/pages/Absences/ClassAbsences.jsx`
**Roles:** ADMIN, HEADMASTER, TEACHER

API: `GET /api/absences/class/{classId}`

---

### SchoolAbsences

**Route:** `/absences/school/:schoolId`
**File:** `src/pages/Absences/SchoolAbsences.jsx`
**Roles:** ADMIN, HEADMASTER

API: `GET /api/absences/school/{schoolId}`

---

### AllSchoolsAbsences

**Route:** `/absences`
**File:** `src/pages/Absences/AllSchoolsAbsences.jsx`
**Role:** ADMIN

API: `GET /api/absences`

---

## Complaints

Complaints (notes/remarks) are recorded by teachers against students for behavioral or academic issues.

### StudentComplaints

**Routes:** `/complaints/student/:studentId` · `/complaints/me`
**File:** `src/pages/Complaints/StudentComplaints.jsx`

API: `GET /api/complaints/student/{studentId}` or `/api/complaints/me`

Columns: Date · Subject · Teacher · Description

---

### ClassComplaints

**Route:** `/complaints/class/:classId`
**File:** `src/pages/Complaints/ClassComplaints.jsx`
**Roles:** ADMIN, HEADMASTER, TEACHER

API: `GET /api/complaints/class/{classId}`

---

### SchoolComplaints

**Route:** `/complaints/school/:schoolId`
**File:** `src/pages/Complaints/SchoolComplaints.jsx`
**Roles:** ADMIN, HEADMASTER

API: `GET /api/complaints/school/{schoolId}`

---

### AllSchoolsComplaints

**Route:** `/complaints`
**File:** `src/pages/Complaints/AllSchoolsCompaints.jsx`
**Role:** ADMIN

API: `GET /api/complaints`

---

## Schedule

### Schedule (class editor)

**Route:** `/schedule/:classId`
**File:** `src/pages/Schedule/Schedule.jsx`
**Roles:** ADMIN, HEADMASTER, TEACHER, PARENT, STUDENT

Full schedule editor/viewer for a class.

#### API calls

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/classes/{classId}` | Class info (name, schoolId, grade) |
| GET | `/api/schedules/class/{classId}` | Existing schedule entries |
| GET | `/api/subjects` | Subject dropdown |
| GET | `/api/users/teachers/school/{schoolId}` | Teacher dropdown |
| GET | `/api/schools/{schoolId}/schedule` | School time slots |
| GET | `/api/schedules/teacher/{teacherId}` | Teacher's existing schedule (conflict check) |
| POST | `/api/schedules` | Create entry |
| DELETE | `/api/schedules/{id}` | Delete entry |

#### Features

- **Term 1 / Term 2 tabs**
- **Grid layout**: Rows = school time slots, Columns = Mon–Fri
- **Add entry form**: Subject · Teacher · Day · Time slot · Lecture type · Attendance tracking (optional)
- **Conflict detection**: Checks if the selected teacher is already teaching at the same day/time
- **Lecture types**: STANDARD · SIP · EXTRACURRICULAR
- Teachers/students can only view; only ADMIN and HEADMASTER can add/delete entries

### Profile page

**Route:** `/profile`
**File:** `src/pages/Profile/Profile.jsx`
**Roles:** All authenticated

#### API calls

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/profile` | Load user profile data |
| PUT | `/api/profile/picture` | Upload avatar (multipart) |
| DELETE | `/api/profile/picture` | Remove avatar |
| PUT | `/api/profile/bio` | Update bio (max 500 chars) |
| PUT | `/api/profile/password` | Change password |

#### Features

- Avatar upload with preview (click avatar to open file picker)
- Bio textarea with character counter
- Password change form: current password + new password + confirm (validated client-side)
- Success/error alerts per section
