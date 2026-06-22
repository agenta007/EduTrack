# Architecture

## Directory Structure

```
frontend/src/
├── api/
│   └── axiosInstance.js        # Axios client (base URL, withCredentials)
├── components/
│   ├── Layout.jsx              # Page wrapper with responsive sidebar
│   ├── Sidebar.jsx             # Role-based navigation drawer
│   ├── UserAvatar.jsx          # Avatar with image or initials fallback
│   └── WelcomeBanner.jsx       # Dashboard hero with quick-action cards
├── context/
│   ├── AuthProvider.jsx        # JWT auth state + token refresh
│   ├── SidebarContext.jsx      # Desktop sidebar collapse state
│   └── StudentContext.jsx      # Parent's selected child
├── hooks/
│   └── useAuth.jsx             # Shortcut hook for AuthContext
├── i18n/
│   ├── index.js                # i18next setup
│   └── locales/
│       ├── en.json             # English strings
│       └── bg.json             # Bulgarian strings
├── pages/
│   ├── Absences/               # Absence views (student/class/school/all)
│   ├── Admin/                  # Admin-only management pages
│   ├── Complaints/             # Complaint views
│   ├── Grades/                 # Grade views
│   ├── Headmaster/             # Headmaster management pages
│   ├── Login/                  # Authentication page
│   ├── Parent/                 # Parent home
│   ├── Profile/                # User profile + avatar + password
│   ├── Schedule/               # Class schedule editor
│   ├── Selection Pages/        # Intermediate selection steps
│   ├── Statistics/             # Analytics pages
│   ├── Student/                # Student home + calendar
│   ├── Teacher/                # Teacher home + schedule + school
│   └── Unauthorized/           # 403 placeholder
├── router/
│   ├── AppRouter.jsx           # All <Route> definitions
│   ├── ProtectedRoute.jsx      # Role + auth guard
│   └── RoleRedirect.jsx        # / → role-specific home
├── styles/
│   ├── global.css
│   ├── login.css
│   └── sidebar.css
├── App.jsx                     # Root component → AppRouter
├── main.jsx                    # ReactDOM.createRoot + providers
└── theme.jsx                   # MUI theme (palette, component overrides)
```

## Entry Point and Provider Tree

```
main.jsx
└── <BrowserRouter>
    └── <ThemeProvider theme={theme}>
        └── <AuthProvider>
            └── <StudentProvider>
                └── <SidebarProvider>
                    └── <App />   →   <AppRouter />
```

Every page has access to all four contexts without prop drilling.

## Authentication Model

The backend issues:
- **Access token** — short-lived JWT (24 h configured, typically 15 min in production), stored in React state (never localStorage).
- **Refresh token** — long-lived, stored in an **HttpOnly cookie** (inaccessible to JS).

### Token lifecycle

```
App mount
  └── AuthProvider useEffect
        └── POST /auth/refresh   (cookie sent automatically)
              ├── success → setAccessToken, setUser, setLoading(false)
              └── failure → setLoading(false)   (user stays logged out)

Every 15 minutes:
  └── setInterval → POST /auth/refresh  (silently refreshes access token)

Login:
  └── POST /auth/login { email, password }
        └── response: { accessToken }
              └── setAccessToken → api.defaults.headers.Authorization = "Bearer ..."
                  setUser(jwtDecode(token))

Logout:
  └── POST /auth/logout   (clears server-side refresh token)
        └── setAccessToken(null), setUser(null)
```

### Access control

`ProtectedRoute` wraps every route that requires authentication:

```jsx
<ProtectedRoute roles={["ADMIN", "HEADMASTER"]}>
  <SomePage />
</ProtectedRoute>
```

Logic:
1. If `loading` → show `<CircularProgress />` (wait for silent refresh).
2. If `!user` → redirect to `/login`.
3. If `user.role` not in `roles` → redirect to `/unauthorized`.
4. Otherwise → render `children`.

## Data Flow Pattern

Most pages follow the same pattern:

```
useEffect (on mount)
  └── api.get('/api/...')     ← axios with Bearer header
        ├── .then(res => setState(res.data))
        ├── .catch(() => setError(...))
        └── .finally(() => setLoading(false))

Render:
  ├── loading → <CircularProgress />
  ├── error   → <Alert severity="error">
  └── data    → table / list / cards
```

Mutations follow:
```
user action (button click)
  └── setSaving(true)
        └── api.post/put/delete(...)
              ├── .then → update local state optimistically / replace with server data
              ├── .catch → setError(...)
              └── .finally → setSaving(false)
```

## Role System

| Role | Home | Key capabilities |
|---|---|---|
| `ADMIN` | `/admin` | Manage all users, schools, subjects; view all statistics |
| `HEADMASTER` | `/headmaster` | Manage own school, hire/fire teachers, enroll students |
| `TEACHER` | `/teacher` | View schedule, enter grades, record absences/complaints |
| `STUDENT` | `/student` | View own grades, absences, calendar |
| `PARENT` | `/parent` | View child's grades, absences, switch between children |

The role string comes from the decoded JWT (`user.role`) and must match exactly.

## Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_BACKEND_BASE_URL` | Base URL for all API calls (e.g. `http://localhost:5000`) |

Set in `.env.development` and `.env.production`.

## MUI Theme

Defined in `theme.jsx`:
- **Primary**: `#507DBC` (blue)
- **Secondary**: `#F1F2EE` (off-white)
- Component overrides for `MuiTableHead` (bold headers) and `MuiChip` (bold labels).
