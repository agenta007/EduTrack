# Shared Components

## Layout

**File:** `src/components/Layout.jsx`

Wraps every page. Provides the sidebar and the correct content area margins.

### Props

| Prop | Type | Description |
|---|---|---|
| `children` | ReactNode | Page content |

### Behavior

- On **desktop**: leaves a left margin equal to the sidebar width (240 px open, 0 px collapsed). Margin transitions smoothly via CSS transition.
- On **mobile**: no left margin; the sidebar is a temporary drawer that slides over the content.
- Uses `SidebarContext` to read `desktopOpen` state.

### Usage

```jsx
function MyPage() {
  return (
    <Layout>
      <Box sx={{ p: 3 }}>...</Box>
    </Layout>
  );
}
```

---

## Sidebar

**File:** `src/components/Sidebar.jsx`

Role-based navigation drawer. Renders differently per `user.role`.

### State

| State | Description |
|---|---|
| `mobileOpen` | Whether the mobile temporary drawer is open |
| `openMenu` | Which submenu key is currently expanded |

### Menu structure by role

**ADMIN**
- Home
- Manage Users → `/admin/manageUsers`
- Schools → `/admin/viewSchools`
- Subjects → `/admin/viewSubjects`
- Statistics (submenu)
  - School Statistics → `/select/school/statistics`
  - Teacher Statistics → `/select/teacher/statistics`
  - Subject Statistics → `/select/subject/statistics`
- Grades → `/grades`
- Absences → `/absences`
- Complaints → `/complaints`
- Profile → `/profile`
- Logout

**HEADMASTER**
- Home
- My School → `/headmaster/mySchool`
- Subjects → `/admin/viewSubjects`
- Schedule → `/select/class/schedule`
- Grades → `/select/class/grades`
- Absences → `/select/class/absences`
- Complaints → `/select/class/complaints`  *(Admin+Teacher only in router)*
- Teachers → `/headmaster/viewTeachers`
- Parents → `/headmaster/viewParents`
- Students → `/headmaster/viewStudents`
- Profile / Logout

**TEACHER**
- Home
- My School → `/teacher/school`
- Schedule → `/teacher/teacherSchedule/:teacherId`
- **My Statistics** → `/statistics/teacher/me`
- Grades → `/select/class/grades`
- Absences → `/select/class/absences`
- Complaints → `/select/class/complaints`
- Profile / Logout

**STUDENT**
- Home
- Grades → `/grades/me`
- Absences → `/absences/me`
- Complaints → `/complaints/me`  *(if present)*
- Profile / Logout

**PARENT**
- Home
- Schedule (child's class)
- Grades → `/grades/me`
- Absences → `/absences/me`
- View Student → `/student/:id`
- Profile / Logout
- Child selector (if multiple children)

### Language toggle

Two `ToggleButton` buttons (EN / BG) call `i18n.changeLanguage()` and persist the choice.

### Desktop collapse

Clicking the hamburger on desktop toggles `SidebarContext.desktopOpen`. The drawer width animates between 240 px and 0 px.

---

## UserAvatar

**File:** `src/components/UserAvatar.jsx`

Displays a user's profile picture. Falls back to colored initials if no picture is set.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `userId` | number | required | ID of the user whose picture to fetch |
| `name` | string | required | Full name — used for initials and aria-label |
| `size` | number | `40` | Diameter in pixels |
| `refreshToken` | any | — | Change this value to force a re-fetch (e.g. after upload) |
| `sx` | object | — | Additional MUI `sx` styles |

### Behavior

1. Calls `GET /api/users/{userId}/picture` (blob).
2. Creates an object URL (`URL.createObjectURL`) and sets it on an `<img>`.
3. On unmount or re-fetch, revokes the previous object URL to prevent memory leaks.
4. If the request returns 404 or any error, shows a MUI `<Avatar>` with the user's initials (first letter of first name + first letter of last name), colored via a deterministic hash of the name.

### Usage

```jsx
<UserAvatar userId={42} name="John Smith" size={48} />

// Force re-fetch after upload:
<UserAvatar userId={42} name="John Smith" refreshToken={uploadCount} />
```

---

## WelcomeBanner

**File:** `src/components/WelcomeBanner.jsx`

Hero banner shown on every role's home page. Displays the logged-in user's avatar, name, email, role chip, and a row of quick-action cards.

### Props

None. Reads everything from context (`useAuth`, `useStudent`).

### Quick actions by role

| Role | Cards |
|---|---|
| ADMIN | Users, Schools, Subjects, Statistics |
| HEADMASTER | Teachers, Students, Parents, Grades, Absences, Subjects |
| TEACHER | Schedule, School, Grades, Absences, Complaints |
| STUDENT | Grades, Absences, Profile |
| PARENT | Grades (child), Absences (child), Profile |

Parent cards are context-aware: they link to the currently selected child's data. The child name is displayed below the cards.

### Layout

```
┌────────────────────────────────────────────┐
│  [Avatar]  John Smith                       │
│            john@example.com   [TEACHER]     │
├────────────────────────────────────────────┤
│  [Schedule]  [School]  [Grades]  [Absences] │
└────────────────────────────────────────────┘
```
