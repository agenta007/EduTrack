# Headmaster Pages

All headmaster pages are restricted to the `HEADMASTER` role.

---

## HeadmasterHome

**Route:** `/headmaster`
**File:** `src/pages/Headmaster/HeadmasterHome.jsx`

Dashboard with `<WelcomeBanner>`. Quick-action cards link to Teachers, Students, Parents, Grades, Absences, Subjects.

---

## HeadmasterSchool

**Route:** `/headmaster/mySchool`
**File:** `src/pages/Headmaster/HeadmasterSchool.jsx`

Central management page for the headmaster's own school. Divided into five sections.

### API calls

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/profile` | Get current user's schoolId |
| GET | `/api/schools/{schoolId}` | School details |
| GET | `/api/schools/{schoolId}/schedule` | Daily schedule entries |
| GET | `/api/schools/{schoolId}/term-config` | Term date configuration |
| GET | `/api/classes/school/{schoolId}` | List of classes |
| PATCH | `/api/schools/{schoolId}/info` | Save name/address |
| PUT | `/api/schools/{schoolId}/term-config` | Save term dates |
| PUT | `/api/schools/{schoolId}/student-limit` | Set enrollment cap |
| POST | `/api/schools/{schoolId}/schedule` | Add schedule entry |
| PUT | `/api/schools/schedule/{entryId}` | Edit schedule entry |
| DELETE | `/api/schools/schedule/{entryId}` | Delete schedule entry |

### Sections

**1. School Info**
Editable fields: Name, Address. Read-only: Type, Headmaster name.
Save button calls `PATCH /api/schools/{schoolId}/info`.

**2. Classes**
Read-only table listing all classes in the school, sorted alphabetically.
Columns: Class name, School year.
Data from `GET /api/classes/school/{schoolId}`.

**3. Class Weekly Timetable** (sub-component `ClassTimetable`)
Full weekly schedule editor. See [ClassTimetable](#classtimetable) below.

**4. Daily Schedule**
Time slots for the school day (LECTURE, BREAK, SPECIAL_EVENT).
Each entry has: type, label, startTime, endTime, optional eventDate.
Supports add / edit / delete.

**5. Term Configuration**
Six date fields (MM-dd format):
- School Year Start
- Term 2 Start
- Elementary End (grades 1–4)
- Progymnasium End (grades 5–7)
- Gymnasium End (grades 8–12)

**6. Student Limit**
Integer field (blank = unlimited). Stored on the school entity.
Enforced at enrollment time by the backend.

---

## ClassTimetable

**File:** `src/pages/Headmaster/ClassTimetable.jsx`
**Used by:** HeadmasterSchool (with `canEdit={true}`)

Renders and edits a class's weekly schedule as a 5-column (Mon–Fri) grid of time slots.

### Props

| Prop | Type | Description |
|---|---|---|
| `schoolId` | number | Used to fetch available classes, teachers |
| `canEdit` | boolean | Show add/edit/delete controls |

### API calls

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/classes/school/{schoolId}` | All classes (for class selector dropdown) |
| GET | `/api/schedules/class/{classId}` | Schedule entries for selected class |
| GET | `/api/subjects` | Subject list |
| GET | `/api/users/teachers/school/{schoolId}` | Teacher list |
| POST | `/api/schedules` | Create schedule entry |
| PATCH | `/api/schedules/{id}/type` | Change lecture type |
| DELETE | `/api/schedules/{id}` | Remove entry |

### Features

- Class selector dropdown (fetches classes for school)
- Two terms displayed in tabs (Term 1 / Term 2)
- Grid layout: rows = time slots from school daily schedule, columns = Mon–Fri
- Click empty cell to add entry (subject + teacher + lectureType + attendance flag)
- Click existing entry to edit or delete
- Lecture types: `STANDARD`, `SIP`, `EXTRACURRICULAR`
- Conflict detection handled by the backend

---

## ViewTeachers

**Route:** `/headmaster/viewTeachers`
**File:** `src/pages/Headmaster/ViewTeachers.jsx`

Manage teachers in the headmaster's school.

### API calls

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/profile` | Get school |
| GET | `/api/teachers/school/{schoolId}` | Fetch teachers |
| GET | `/api/subjects` | Subjects for qualification matrix |
| POST | `/api/teachers/create-and-hire` | Create user + hire as teacher in one step |
| DELETE | `/api/teachers/{teacherId}/fire` | Remove teacher from school |
| PUT | `/api/teachers/{teacherId}/salary` | Set/update salary |
| PUT | `/api/teachers/{teacherId}/qualifications` | Assign subject qualifications |

### Features

**Subject filter** — dropdown to show only teachers who teach a given subject (client-side).

**Teacher table columns:**
- Name, Email, Classes taught, Qualifications (chips), Salary, Actions

**Hire dialog (Create & Hire):**
- Fields: First Name, Last Name, Email, Password
- Calls `POST /api/teachers/create-and-hire`
- Creates a user with TEACHER role and simultaneously links them to the school

**Qualification editor:**
- Checkbox matrix of all subjects
- Calls `PUT /api/teachers/{teacherId}/qualifications` on save

**Salary editor:**
- Inline number field per row
- Calls `PUT /api/teachers/{teacherId}/salary`

**Fire:**
- Confirmation dialog → `DELETE /api/teachers/{teacherId}/fire`

---

## ViewStudents

**Route:** `/headmaster/viewStudents`
**File:** `src/pages/Headmaster/ViewStudents.jsx`

Manage student enrollment.

### API calls

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/profile` | Get school |
| GET | `/api/users/students/school/{schoolId}` | Fetch enrolled students |
| GET | `/api/parents/school/{schoolId}` | Build parent name map |
| GET | `/api/students/capacity` | Current count + school limit |
| GET | `/api/students/available` | Users with STUDENT role not yet enrolled |
| POST | `/api/students/{userId}/enroll` | Enroll existing user |
| POST | `/api/students/create-and-enroll` | Create user + enroll in one step |
| DELETE | `/api/students/{studentId}/expel` | Remove student from school |

### Features

**Capacity chip** — shows `X / Y enrolled` (or just `X enrolled` if no limit). Turns red when at capacity.

**Enroll button** — disabled when at limit. Opens dialog listing available (unenrolled) users.

**Create & Enroll button** — opens dialog with:
- First Name, Last Name, Email, Password
- Calls `POST /api/students/create-and-enroll`
- Creates a new STUDENT user and enrolls them immediately

**Student table columns:**
- Name, Email, Parent, Actions (Expel)

**Expel** — confirmation dialog → `DELETE /api/students/{studentId}/expel`

---

## ViewParents

**Route:** `/headmaster/viewParents`
**File:** `src/pages/Headmaster/ViewParents.jsx`

Manage parent accounts and their links to students.

### API calls

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/profile` | Get school |
| GET | `/api/parents/school/{schoolId}` | Fetch parents |
| GET | `/api/users/students/school/{schoolId}` | Students (for linking) |
| POST | `/api/parents` | Create parent account |
| GET | `/api/parents/available` | Unlinked parents |
| POST | `/api/parents/{parentId}/link/{studentId}` | Link parent ↔ student |
| DELETE | `/api/parents/{parentId}/unlink/{studentId}` | Remove link |
| PUT | `/api/parents/{parentId}` | Edit parent info |

### Features

- Parent table with linked students shown as chips
- Add parent dialog (name, email, password)
- Link/unlink student dialog per parent
- Edit parent info dialog
- Constraint: one student can only have one parent account
