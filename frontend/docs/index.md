# EduTrack Frontend — Documentation Index

EduTrack is a school management system built with **React 18 + Vite**, **Material UI v5**, and **i18next** for bilingual support (English / Bulgarian).

## Documents

| File                                                                         | Contents                                                       |
|------------------------------------------------------------------------------|----------------------------------------------------------------|
| [architecture.md](./architecture.md)                                         | Project structure, data flow, auth model                       |
| [routing.md](./routing.md)                                                   | All routes, role guards, redirects                             |
| [components.md](./components.md)                                             | Shared components (Layout, Sidebar, UserAvatar, WelcomeBanner) |
| [context.md](./context.md)                                                   | React context providers and hooks                              |
| [database-model.md](./database-model.md)                                     | Database model                                                 |
| [pages/admin.md](./pages/admin.md)                                           | Admin pages (ManageUsers, ViewSchools, ViewSubjects)           |
| [pages/headmaster.md](./pages/headmaster.md)                                 | Headmaster pages (School, Teachers, Students, Parents)         |
| [pages/teacher.md](./pages/teacher.md)                                       | Teacher pages (Home, Schedule, School)                         |
| [pages/student.md](./pages/student.md)                                       | Student pages (Home, Calendar)                                 |
| [pages/parent.md](./pages/parent.md)                                         | Parent pages                                                   |
| [pages/statistics.md](./pages/statistics.md)                                 | Statistics pages and selection pages                           |
| [pages/grades-absences-complaints.md](./pages/grades-absences-complaints.md) | Grades, Absences, Complaints pages                             |
| [api.md](./api.md)                                                           | All backend API endpoints consumed by the frontend             |
| [i18n.md](./i18n.md)                                                         | Internationalization — key structure, adding translations      |

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React 18 (JSX, hooks) |
| Build tool | Vite |
| UI | Material UI v5 (MUI) |
| Routing | React Router v6 |
| HTTP | Axios (with credentials) |
| i18n | i18next + react-i18next |
| Auth | JWT (access token in memory, refresh token in HttpOnly cookie) |
| State | React Context + useState/useMemo |
