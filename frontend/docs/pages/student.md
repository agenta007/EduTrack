# Student & Parent Pages

---

## StudentHome

**Route:** `/student`
**File:** `src/pages/Student/StudentHome.jsx`
**Role:** STUDENT

Dashboard with `<WelcomeBanner>`. Quick-action cards: Grades, Absences, Profile.

---

## StudentCalendar

**Route:** `/student/calendar`
**File:** `src/pages/Student/StudentCalendar.jsx`
**Role:** STUDENT

Interactive monthly calendar of school events for the logged-in student.

### API calls

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/events/student/me` | Fetch all calendar events for the student |

### Event types

| Type | Color/label |
|---|---|
| `TEST` | Orange |
| `HOLIDAY` | Green |
| `MEETING` | Blue |
| `OTHER` | Grey |

### Layout

**Left: Calendar grid**
- Month/year header with prev/next navigation and "Today" button
- 7-column grid (Sun–Sat)
- Days with events show colored dot indicators (up to 3, then "+N")
- Clicking a day selects it and shows its events in the right panel

**Right: Event list**
- Top: Events on the selected day
- Bottom: Upcoming events in the next 30 days
- Each event card shows: type chip, title, description, class/school, date

---

## ParentHome

**Route:** `/parent`
**File:** `src/pages/Parent/ParentHome.jsx`
**Role:** PARENT

Dashboard with `<WelcomeBanner>`. The banner is context-aware — it reads `selectedStudent` from `StudentContext` and links the quick-action cards (Grades, Absences) to that student's data.

If the parent has multiple linked students, the sidebar shows a child selector that updates `selectedStudent`.
