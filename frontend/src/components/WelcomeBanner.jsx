import React from 'react';
import {
  Box, Card, CardActionArea, CardContent, Chip, Paper, Typography,
} from '@mui/material';
import {
  BarChart as StatsIcon,
  ManageAccounts,
  CalendarMonth as ScheduleIcon,
  Book as SubjectIcon,
  Business as SchoolIcon,
  Grade as GradeIcon,
  EventBusy as AbsenceIcon,
  Report as ComplaintIcon,
  Work as TeacherIcon,
  EscalatorWarning as ParentIcon,
  School as StudentIcon,
  AccountCircle as ProfileIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuth from '../hooks/useAuth';
import { useStudent } from '../context/StudentContext';
import UserAvatar from './UserAvatar';

const ROLE_CHIP_COLOR = {
  ADMIN:      'error',
  HEADMASTER: 'primary',
  TEACHER:    'success',
  STUDENT:    'info',
  PARENT:     'warning',
};

function QuickCard({ icon, label, onClick }) {
  return (
    <Card variant="outlined" sx={{ width: 140, flexShrink: 0 }}>
      <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
        <CardContent sx={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 1, py: 2.5, px: 1.5,
        }}>
          <Box sx={{ color: 'primary.main', '& svg': { fontSize: 30 } }}>{icon}</Box>
          <Typography variant="body2" fontWeight={600} textAlign="center" sx={{ lineHeight: 1.3 }}>
            {label}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function WelcomeBanner() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedStudent } = useStudent();
  const navigate = useNavigate();

  const actions = (() => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { label: t('nav.manageUsers'), icon: <ManageAccounts />, path: '/admin/manageUsers' },
          { label: t('nav.schools'),     icon: <SchoolIcon />,     path: '/admin/viewSchools' },
          { label: t('nav.subjects'),    icon: <SubjectIcon />,    path: '/admin/viewSubjects' },
          { label: t('nav.statistics'),  icon: <StatsIcon />,      path: '/select/school/statistics' },
        ];
      case 'HEADMASTER':
        return [
          { label: t('nav.teachers'),   icon: <TeacherIcon />,  path: '/headmaster/viewTeachers' },
          { label: t('nav.students'),   icon: <StudentIcon />,  path: '/headmaster/viewStudents' },
          { label: t('nav.parents'),    icon: <ParentIcon />,   path: '/headmaster/viewParents' },
          { label: t('nav.grades'),     icon: <GradeIcon />,    path: '/select/class/grades' },
          { label: t('nav.absences'),   icon: <AbsenceIcon />,  path: '/select/class/absences' },
          { label: t('nav.subjects'),   icon: <SubjectIcon />,  path: '/admin/viewSubjects' },
        ];
      case 'TEACHER':
        return [
          { label: t('nav.schedule'),   icon: <ScheduleIcon />,  path: `/teacher/teacherSchedule/${user.id}` },
          { label: t('nav.mySchool'),   icon: <SchoolIcon />,    path: '/teacher/school' },
          { label: t('nav.grades'),     icon: <GradeIcon />,     path: '/select/class/grades' },
          { label: t('nav.absences'),   icon: <AbsenceIcon />,   path: '/select/class/absences' },
          { label: t('nav.complaints'), icon: <ComplaintIcon />, path: '/select/class/complaints' },
        ];
      case 'STUDENT':
        return [
          { label: t('nav.grades'),   icon: <GradeIcon />,   path: '/grades/me' },
          { label: t('nav.absences'), icon: <AbsenceIcon />, path: '/absences/me' },
          { label: t('nav.profile'),  icon: <ProfileIcon />, path: '/profile' },
        ];
      case 'PARENT':
        return selectedStudent ? [
          { label: t('nav.grades'),   icon: <GradeIcon />,   path: `/grades/student/${selectedStudent.id}` },
          { label: t('nav.absences'), icon: <AbsenceIcon />, path: `/absences/student/${selectedStudent.id}` },
          { label: t('nav.profile'),  icon: <ProfileIcon />, path: '/profile' },
        ] : [
          { label: t('nav.profile'),  icon: <ProfileIcon />, path: '/profile' },
        ];
      default:
        return [];
    }
  })();

  return (
    <Box sx={{ p: 3, maxWidth: 760 }}>

      {/* ── Hero card ─────────────────────────────────────────────────── */}
      <Paper
        variant="outlined"
        sx={{ p: 3, mb: 3, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}
      >
        <UserAvatar userId={user?.id} name={user?.name} size={96} />
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            {t(`welcome.${user?.role}`, { name: user?.name })}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {user?.email}
          </Typography>
          <Chip label={t(`roles.${user?.role}`)} color={ROLE_CHIP_COLOR[user?.role] ?? 'default'} size="small" />
        </Box>
      </Paper>

      {/* ── Quick-access tiles ────────────────────────────────────────── */}
      {actions.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {actions.map(({ label, icon, path }) => (
            <QuickCard key={path} label={label} icon={icon} onClick={() => navigate(path)} />
          ))}
        </Box>
      )}

    </Box>
  );
}

export default WelcomeBanner;
