# Admin Pages

Admin pages are accessible only to the `ADMIN` role (except `ViewSubjects` which also allows `HEADMASTER`).

---

## AdminHome

**Route:** `/admin`
**File:** `src/pages/Admin/AdminHome.jsx`

Simple dashboard. Renders `<Layout>` + `<WelcomeBanner>`. The banner provides quick-action cards to all admin sections.

---

## ManageUsers

**Route:** `/admin/manageUsers`
**File:** `src/pages/Admin/ManageUsers.jsx`

Full CRUD for all user accounts across the system.

### API calls

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/users` | Fetch all users |
| GET | `/api/schools` | Fetch school list (for filter dropdown) |
| POST | `/api/users` | Create a new user |
| PUT | `/api/users/{id}` | Update user fields |
| DELETE | `/api/users/{id}` | Delete a user |

### Features

**Table columns:** Avatar · ID · First Name · Last Name · Email · Role · School Name · Actions

**Sorting:** Click any column header to sort ascending/descending. Implemented client-side via `slice().sort()`.

**Filtering:**
- Role chips (ALL, ADMIN, HEADMASTER, TEACHER, STUDENT, PARENT) — single select.
- School dropdown — filters by `u.schoolId`.

**Dialogs:**
- **Add User** — fields: firstName, lastName, email, password (required), role. Calls `POST /api/users`.
- **Edit User** — same fields, password optional. Clicking a row opens this dialog. Calls `PUT /api/users/{id}`.
- **Delete Confirmation** — confirm before `DELETE /api/users/{id}`.

### State

```js
users, schools, loading, error, saving
roleFilter ('ALL'), schoolFilter ('')
sortBy ('id'), sortDir ('asc')
addOpen, addForm
editOpen, editId, editForm
confirmId, confirmName
```

---

## ViewSchools

**Route:** `/admin/viewSchools`
**File:** `src/pages/Admin/ViewSchools.jsx`

Manage schools including their profiles and daily schedules.

### API calls

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/schools` | Fetch all schools |
| GET | `/api/users/headmasters` | Fetch headmasters for assignment |
| POST | `/api/schools` | Create school |
| PUT | `/api/schools/{id}` | Update school |
| DELETE | `/api/schools/{id}` | Delete school |
| GET | `/api/schools/{id}/profiles` | Fetch school's profiles |
| POST | `/api/schools/{id}/profiles` | Add profile |
| DELETE | `/api/schools/profiles/{profileId}` | Remove profile |
| GET | `/api/schools/{id}/schedule` | Fetch daily schedule |
| POST | `/api/schools/{id}/schedule` | Add schedule entry |
| PUT | `/api/schools/schedule/{entryId}` | Edit schedule entry |
| DELETE | `/api/schools/schedule/{entryId}` | Delete schedule entry |

### Features

- School cards in a grid
- Expandable panel per school with:
  - **Profiles** (e.g. "English Profile", "Math Profile") — add/delete
  - **Daily Schedule** — time slots (LECTURE/BREAK/SPECIAL_EVENT) with start/end times and labels
- Headmaster assignment dropdown (fetches users with role HEADMASTER)
- School type chip (`ELEMENTARY`, `PROGYMNASIUM`, `GYMNASIUM`, etc.)

---

## ViewSubjects

**Route:** `/admin/viewSubjects`
**File:** `src/pages/Admin/ViewSubjects.jsx`
**Roles:** ADMIN, HEADMASTER

Manage the global list of subjects. Subjects are school-independent — they are assigned to teachers as qualifications and to schedule entries.

### API calls

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/subjects` | Fetch all subjects |
| POST | `/api/subjects` | Create subject (ADMIN only) |
| PUT | `/api/subjects/{id}` | Edit subject (ADMIN only) |
| DELETE | `/api/subjects/{id}` | Delete subject (ADMIN only) |

### Features

- Table with subject name
- Add/Edit dialog (name field)
- Delete confirmation
- Headmaster can view but not modify (buttons hidden by role check)
