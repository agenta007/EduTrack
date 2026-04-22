import React from 'react';

import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRedirect from './RoleRedirect';
import Login from '../pages/Login/Login';
import Unauthorized from '../pages/Unauthorized/Unauthorized';

import Profile from '../pages/Profile/Profile';
import AdminHome from '../pages/Admin/AdminHome'
import AdminManageUsers from '../pages/Admin/ManageUsers';
import ViewSchools from '../pages/Admin/ViewSchools';
import ViewSubjects from '../pages/Admin/ViewSubjects';

import HeadmasterHome from '../pages/Headmaster/HeadmasterHome';
import HeadmasterSchool from '../pages/Headmaster/HeadmasterSchool';
import ViewParents from '../pages/Headmaster/ViewParents';
import ViewStudents from '../pages/Headmaster/ViewStudents';
import ViewTeachers from '../pages/Headmaster/ViewTeachers';

import ParentHome from '../pages/Parent/ParentHome';
import StudentHome from '../pages/Student/StudentHome';
import StudentCalendar from '../pages/Student/StudentCalendar';

import TeacherHome from '../pages/Teacher/TeacherHome';
import TeacherSchedule from '../pages/Teacher/TeacherSchedule';
import TeacherSchool from '../pages/Teacher/TeacherSchool';

import Schedule from '../pages/Schedule/Schedule';

import SchoolStatistics from '../pages/Statistics/SchoolStatistics';
import SubjectStatistics from '../pages/Statistics/SubjectStatistics';
import TeacherStatistics from '../pages/Statistics/TeacherStatistics';

import StudentAbsences from '../pages/Absences/StudentAbsences';
import ClassAbsences from '../pages/Absences/ClassAbsences';
import SchoolAbsences from '../pages/Absences/SchoolAbsences';
import AllSchoolsAbsences from '../pages/Absences/AllSchoolsAbsences';

import StudentGrades from '../pages/Grades/StudentGrades';
import ClassGrades from '../pages/Grades/ClassGrades';
import SchoolGrades from '../pages/Grades/SchoolGrades';
import AllSchoolsGrades from '../pages/Grades/AllSchoolsGrades';

import SelectSchoolForStatistics from '../pages/Selection Pages/SelectSchoolForStatistics';
import SelectTeacherForStatistics from '../pages/Selection Pages/SelectTeacherForStatistics';
import SelectSubjectForStatistics from '../pages/Selection Pages/SelectSubjectForStatistics';
import SelectClassForScheduleView from '../pages/Selection Pages/SelectClassForScheduleView';
import SelectClassForGradesView from '../pages/Selection Pages/SelectClassForGradesView';
import SelectClassForAbsencesView from '../pages/Selection Pages/SelectClassForAbsenceView';
import SelectClassForComplaintsView from '../pages/Selection Pages/SelectClassForComplaintsView';

import AllSchoolsComplaints from '../pages/Complaints/AllSchoolsCompaints';
import SchoolComplaints from '../pages/Complaints/SchoolComplaints';
import ClassComplaints from '../pages/Complaints/ClassComplaints';
import StudentComplaints from '../pages/Complaints/StudentComplaints';


function AppRouter() {
  return (
    <Routes>
      {/* Default redirect to home based on role*/}
      <Route path="/" element={<RoleRedirect/>}/>

      {/* Route to login page */}
      <Route path="/login" element={<Login/>}/>

      {/* Route to unauthorized page */}
      <Route path="/unauthorized" element={<Unauthorized/>} />

      {/* Profile — all authenticated roles */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute roles={["ADMIN","HEADMASTER","TEACHER","PARENT","STUDENT"]}>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminHome />
          </ProtectedRoute>
        }
      />

      <Route
        path='/admin/manageUsers' 
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminManageUsers/>
          </ProtectedRoute>
        }
      />

      <Route
        path='/admin/viewSchools' 
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <ViewSchools/>
          </ProtectedRoute>
        }
      />

      <Route
        path='/admin/viewSubjects'
        element={
          <ProtectedRoute roles={["ADMIN", "HEADMASTER"]}>
            <ViewSubjects/>
          </ProtectedRoute>
        }
      />

      {/* Headmaster routes */}
      <Route
        path='/headmaster'
        element={
          <ProtectedRoute roles={["HEADMASTER"]}>
            <HeadmasterHome />
          </ProtectedRoute>
        }
      />

      <Route
        path='/headmaster/mySchool'
        element={
          <ProtectedRoute roles={["HEADMASTER"]}>
            <HeadmasterSchool />
          </ProtectedRoute>
        }
      />

      <Route
        path='/headmaster/viewParents'
        element={
          <ProtectedRoute roles={["HEADMASTER"]}>
            <ViewParents/>
          </ProtectedRoute>
        }
      />

      <Route
        path='/headmaster/viewStudents' 
        element={
          <ProtectedRoute roles={["HEADMASTER"]}>
            <ViewStudents/>
          </ProtectedRoute>
        }
      />

      <Route
        path='/headmaster/viewTeachers' 
        element={
          <ProtectedRoute roles={["HEADMASTER"]}>
            <ViewTeachers/>
          </ProtectedRoute>
        }
      />

      {/* Parent routes */}
      <Route
        path='/parent'
        element={
          <ProtectedRoute roles={["PARENT"]}>
            <ParentHome />
          </ProtectedRoute>
        }
      />

      {/* Student routes */}
      <Route
        path='/student'
        element={
          <ProtectedRoute roles={["STUDENT"]}>
            <StudentHome />
          </ProtectedRoute>
        }
      />

      <Route
        path='/student/calendar'
        element={
          <ProtectedRoute roles={["STUDENT"]}>
            <StudentCalendar/>
          </ProtectedRoute>
        }
      />

      {/* Teacher routes */}
      <Route
        path='/teacher'
        element={
          <ProtectedRoute roles={["TEACHER"]}>
            <TeacherHome/>
          </ProtectedRoute>
        }
      />

      <Route
        path='/teacher/school'
        element={
          <ProtectedRoute roles={["TEACHER"]}>
            <TeacherSchool/>
          </ProtectedRoute>
        }
      />

      <Route
        path='/teacher/teacherSchedule/:teacherId'
        element={
          <ProtectedRoute roles={["TEACHER"]}>
            <TeacherSchedule/>
          </ProtectedRoute>
        }
      />

      {/* Schedule route */}
      <Route
        path='/schedule/:classId'
        element={
          <ProtectedRoute roles={["ADMIN", "HEADMASTER", "TEACHER", "PARENT", "STUDENT"]}>
            <Schedule/>
          </ProtectedRoute>
        }
      />

      {/* Statistics routes */}
      <Route
        path='/statistics/subject/:subjectId'
        element={
          <ProtectedRoute roles={["ADMIN", "HEADMASTER"]}>
            <SubjectStatistics/>
          </ProtectedRoute>
        }
      />

      <Route
        path='/statistics/teacher/me'
        element={
          <ProtectedRoute roles={["TEACHER"]}>
            <TeacherStatistics/>
          </ProtectedRoute>
        }
      />

      <Route
        path='/statistics/teacher/:teacherId'
        element={
          <ProtectedRoute roles={["ADMIN", "HEADMASTER"]}>
            <TeacherStatistics/>
          </ProtectedRoute>
        }
      />

      <Route
        path='/statistics/school/:schoolId'
        element={
          <ProtectedRoute roles={["ADMIN", "HEADMASTER"]}>
            <SchoolStatistics/>
          </ProtectedRoute>
        }
      />

      {/* Absences routes */}
      <Route
        path='/absences'
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AllSchoolsAbsences/>
          </ProtectedRoute>
        }
      />
      <Route
        path='/absences/school/:schoolId'
        element={
          <ProtectedRoute roles={["ADMIN", "HEADMASTER"]}>
            <SchoolAbsences/>
          </ProtectedRoute>
        }
      />
      <Route
        path='/absences/class/:classId'
        element={
          <ProtectedRoute roles={["ADMIN", "HEADMASTER", "TEACHER"]}>
            <ClassAbsences/>
          </ProtectedRoute>
        }
      />
      <Route
        path='/absences/student/:studentId'
        element={
          <ProtectedRoute roles={["ADMIN", "HEADMASTER", "TEACHER", "PARENT", "STUDENT"]}>
            <StudentAbsences/>
          </ProtectedRoute>
        }
      />
      <Route
        path='/absences/me'
        element={
          <ProtectedRoute roles={["STUDENT"]}>
            <StudentAbsences/>
          </ProtectedRoute>
        }
      />

      {/* Complaints route */}
      <Route
        path='/complaints'
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AllSchoolsComplaints />
          </ProtectedRoute>
        }
      />
      
      <Route
        path='/complaints/school/:schoolId'
        element={
          <ProtectedRoute roles={["ADMIN", "HEADMASTER"]}>
            <SchoolComplaints />
          </ProtectedRoute>
        }
      />

      <Route
        path='/complaints/class/:classId'
        element={
          <ProtectedRoute roles={["ADMIN", "HEADMASTER", "TEACHER"]}>
            <ClassComplaints />
          </ProtectedRoute>
        }
      />

      <Route
        path='/complaints/student/:studentId'
        element={
          <ProtectedRoute roles={["ADMIN", "HEADMASTER", "TEACHER", "PARENT", "STUDENT"]}>
            <StudentComplaints />
          </ProtectedRoute>
        }
      />

      {/* Grades routes */}
      <Route
        path='/grades'
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AllSchoolsGrades/>
          </ProtectedRoute>
        }
      />
      <Route
        path='/grades/school/:schoolId'
        element={
          <ProtectedRoute roles={["ADMIN", "HEADMASTER"]}>
            <SchoolGrades/>
          </ProtectedRoute>
        }
      />
      <Route
        path='/grades/class/:classId'
        element={
          <ProtectedRoute roles={["ADMIN", "HEADMASTER", "TEACHER"]}>
            <ClassGrades/>
          </ProtectedRoute>
        }
      />
      <Route
        path='/grades/student/:studentId'
        element={
          <ProtectedRoute roles={["ADMIN", "HEADMASTER", "TEACHER", "PARENT", "STUDENT"]}>
            <StudentGrades/>
          </ProtectedRoute>
        }
      />
      <Route
        path='/grades/me'
        element={
          <ProtectedRoute roles={["STUDENT"]}>
            <StudentGrades/>
          </ProtectedRoute>
        }
      />

      {/* Selection pages routes */}
      {/* ony for admin, bc headmaster can't choose school, it will be automatically displayed */}
      <Route 
        path='/select/school/statistics'
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <SelectSchoolForStatistics />
          </ProtectedRoute>
        }
      />
      {/* admin can choose teacher in particular school - 2 fields, headmaster can choose only from teachers in their school */}
      <Route 
        path='/select/teacher/statistics'
        element={
          <ProtectedRoute roles={["ADMIN", "HEADMASTER"]}>
            <SelectTeacherForStatistics />
          </ProtectedRoute>
        }
      />

        {/* same as teacher statistics */}
      <Route 
        path='/select/class/schedule'
        element={
          <ProtectedRoute roles={["ADMIN", "HEADMASTER"]}>
            <SelectClassForScheduleView />
          </ProtectedRoute>
        }
      />

      {/* The admin sees table with all schools, the headmaster - table with all classes in their school, parent/student only for one student, teacher is the only one who needs to select the class to then get to the table with students in it. Same for grades, absences and complaints */}
      <Route
        path='/select/class/grades'
        element={
          <ProtectedRoute roles={["ADMIN", "HEADMASTER", "TEACHER"]}>
            <SelectClassForGradesView />
          </ProtectedRoute>
        }
      />

      <Route
        path='/select/class/absences'
        element={
          <ProtectedRoute roles={["ADMIN", "HEADMASTER", "TEACHER"]}>
            <SelectClassForAbsencesView />
          </ProtectedRoute>
        }
      />

      <Route 
        path='/select/class/complaints'
        element={
          <ProtectedRoute roles={["ADMIN", "TEACHER"]}>
            <SelectClassForComplaintsView />
          </ProtectedRoute>
        }
      />

    </Routes>
  )
}

export default AppRouter