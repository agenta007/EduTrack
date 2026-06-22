# Routing

All routes are defined in `src/router/AppRouter.jsx` using React Router v6.

## Route Table

| Path | Component | Roles |
|---|---|---|
| `/` | RoleRedirect | any authenticated |
| `/login` | Login | public |
| `/unauthorized` | Unauthorized | public |
| `/profile` | Profile | all authenticated roles |
| **Admin** | | |
| `/admin` | AdminHome | ADMIN |
| `/admin/manageUsers` | ManageUsers | ADMIN |
| `/admin/viewSchools` | ViewSchools | ADMIN |
| `/admin/viewSubjects` | ViewSubjects | ADMIN, HEADMASTER |
| **Headmaster** | | |
| `/headmaster` | HeadmasterHome | HEADMASTER |
| `/headmaster/mySchool` | HeadmasterSchool | HEADMASTER |
| `/headmaster/viewParents` | ViewParents | HEADMASTER |
| `/headmaster/viewStudents` | ViewStudents | HEADMASTER |
| `/headmaster/viewTeachers` | ViewTeachers | HEADMASTER |
| **Teacher** | | |
| `/teacher` | TeacherHome | TEACHER |
| `/teacher/school` | TeacherSchool | TEACHER |
| `/teacher/teacherSchedule/:teacherId` | TeacherSchedule | TEACHER |
| **Student** | | |
| `/student` | StudentHome | STUDENT |
| `/student/calendar` | StudentCalendar | STUDENT |
| **Parent** | | |
| `/parent` | ParentHome | PARENT |
| **Schedule** | | |
| `/schedule/:classId` | Schedule | ADMIN, HEADMASTER, TEACHER, PARENT, STUDENT |
| **Statistics** | | |
| `/statistics/school/:schoolId` | SchoolStatistics | ADMIN, HEADMASTER |
| `/statistics/teacher/me` | TeacherStatistics | TEACHER |
| `/statistics/teacher/:teacherId` | TeacherStatistics | ADMIN, HEADMASTER |
| `/statistics/subject/:subjectId` | SubjectStatistics | ADMIN, HEADMASTER |
| **Absences** | | |
| `/absences` | AllSchoolsAbsences | ADMIN |
| `/absences/school/:schoolId` | SchoolAbsences | ADMIN, HEADMASTER |
| `/absences/class/:classId` | ClassAbsences | ADMIN, HEADMASTER, TEACHER |
| `/absences/student/:studentId` | StudentAbsences | ADMIN, HEADMASTER, TEACHER, PARENT, STUDENT |
| `/absences/me` | StudentAbsences | STUDENT |
| **Grades** | | |
| `/grades` | AllSchoolsGrades | ADMIN |
| `/grades/school/:schoolId` | SchoolGrades | ADMIN, HEADMASTER |
| `/grades/class/:classId` | ClassGrades | ADMIN, HEADMASTER, TEACHER |
| `/grades/student/:studentId` | StudentGrades | ADMIN, HEADMASTER, TEACHER, PARENT, STUDENT |
| `/grades/me` | StudentGrades | STUDENT |
| **Complaints** | | |
| `/complaints` | AllSchoolsComplaints | ADMIN |
| `/complaints/school/:schoolId` | SchoolComplaints | ADMIN, HEADMASTER |
| `/complaints/class/:classId` | ClassComplaints | ADMIN, HEADMASTER, TEACHER |
| `/complaints/student/:studentId` | StudentComplaints | ADMIN, HEADMASTER, TEACHER, PARENT, STUDENT |
| **Selection pages** | | |
| `/select/school/statistics` | SelectSchoolForStatistics | ADMIN |
| `/select/teacher/statistics` | SelectTeacherForStatistics | ADMIN, HEADMASTER |
| `/select/subject/statistics` | SelectSubjectForStatistics | ADMIN, HEADMASTER |
| `/select/class/schedule` | SelectClassForScheduleView | ADMIN, HEADMASTER |
| `/select/class/grades` | SelectClassForGradesView | ADMIN, HEADMASTER, TEACHER |
| `/select/class/absences` | SelectClassForAbsencesView | ADMIN, HEADMASTER, TEACHER |
| `/select/class/complaints` | SelectClassForComplaintsView | ADMIN, TEACHER |

## ProtectedRoute

`src/router/ProtectedRoute.jsx` — wraps every authenticated route.

```jsx
<ProtectedRoute roles={["ADMIN", "HEADMASTER"]}>
  <MyPage />
</ProtectedRoute>
```

**Render logic:**
1. `loading === true` → renders `<CircularProgress />` centered (waits for silent token refresh on first load).
2. `!user` → `<Navigate to="/login" replace />`.
3. `roles` provided and `!roles.includes(user.role)` → `<Navigate to="/unauthorized" replace />`.
4. Otherwise → renders `children`.

## RoleRedirect

`src/router/RoleRedirect.jsx` — catches `/` and sends the user to their home page.

```
ADMIN       → /admin
HEADMASTER  → /headmaster
TEACHER     → /teacher
STUDENT     → /student
PARENT      → /parent
(none)      → /login
```

## Selection Page Pattern

Several features require the user to first pick an entity before viewing data. Rather than embedding a modal in every table, EduTrack uses dedicated **selection pages** that navigate to the target page on card click.

Example flow for admin viewing teacher statistics:
```
Sidebar → /select/teacher/statistics
  → SelectTeacherForStatistics
      → user clicks a teacher card
          → navigate(`/statistics/teacher/${teacher.id}`)
              → TeacherStatistics (teacherId from useParams)
```

The same pattern applies to class selection for grades, absences, complaints, and schedule.
