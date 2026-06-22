# Context & Hooks

## AuthProvider

**File:** `src/context/AuthProvider.jsx`

The central authentication context. Manages the access token, decoded user object, and token lifecycle.

### State

| State | Type | Description |
|---|---|---|
| `accessToken` | string \| null | Current JWT access token (in-memory only) |
| `user` | object \| null | Decoded JWT payload (`{ id, role, email, ... }`) |
| `loading` | boolean | `true` while the initial silent refresh is in progress |

### Context value

```js
{
  user,           // decoded JWT or null
  accessToken,
  loading,        // true on first mount while checking session
  login,          // (email, password) → Promise
  logout,         // () → void
  setAccessToken, // used internally by refresh
  mockAdminLogin, // dev-only: bypasses credentials
}
```

### Token refresh lifecycle

**On mount (silent restore):**
```
POST /auth/refresh
  ├── success → setAccessToken, inject header, setUser, setLoading(false)
  └── failure → setLoading(false)   (stays logged out, no redirect)
```

**Every 15 minutes (setInterval):**
```
POST /auth/refresh  → update in-memory access token
```

The interval is cleared on component unmount.

**On login:**
```
POST /auth/login { email, password }
  └── response.data.accessToken → stored in state, injected into axios headers
```

**On logout:**
```
POST /auth/logout  → server invalidates refresh token cookie
  └── clear state, clear axios header
```

### Axios header injection

After every successful token acquisition:
```js
api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

This means all subsequent axios calls carry the token automatically — no need to pass it manually anywhere.

### mockAdminLogin (development only)

Calls `POST /auth/login` with hardcoded admin credentials defined in `application.properties`. Sets `loading(false)` immediately after.

---

## SidebarContext

**File:** `src/context/SidebarContext.jsx`

Tracks whether the desktop permanent sidebar is open or collapsed.

### State

| State | Default | Description |
|---|---|---|
| `desktopOpen` | `true` | Whether the desktop sidebar is expanded |

### Hook

```js
import { useSidebar } from '../context/SidebarContext';
const { desktopOpen, setDesktopOpen } = useSidebar();
```

Used by `Layout.jsx` to compute the content area's left margin, and by `Sidebar.jsx` to toggle open/closed.

---

## StudentContext

**File:** `src/context/StudentContext.jsx`

Manages the parent's view of their children. Allows switching between multiple linked students.

### State

| State | Description |
|---|---|
| `students` | Array of student objects linked to the parent |
| `selectedStudent` | Currently active student (auto-set to first alphabetically) |
| `isParent` | `true` when the logged-in user has role PARENT |

### API

```
GET /parent/students   →   list of { id, firstName, lastName, ... }
```

Only fetched if `user.role === 'PARENT'`.

### Context value

```js
{
  students,
  selectedStudent,
  setSelectedStudent,  // parent can switch the active child
  isParent,
}
```

### Hook

```js
import useStudent from '../hooks/useStudent';  // (if exists) or useContext(StudentContext)
const { selectedStudent, setSelectedStudent } = useStudent();
```

Used in `WelcomeBanner` to show child-specific quick-action links.

---

## useAuth

**File:** `src/hooks/useAuth.jsx`

Convenience hook. Reads `AuthContext` and throws if used outside `AuthProvider`.

```js
import useAuth from '../hooks/useAuth';

function MyComponent() {
  const { user, loading, login, logout } = useAuth();
}
```

### Returns

```js
{
  user,           // null or { id, role, email, firstName, lastName, ... }
  accessToken,
  loading,
  login,
  logout,
  mockAdminLogin,
  setAccessToken,
}
```

`user.role` is the string role (`'ADMIN'`, `'HEADMASTER'`, etc.) used in `ProtectedRoute` checks and in `Sidebar` menu selection.
