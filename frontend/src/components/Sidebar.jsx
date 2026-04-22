import React, { useState } from 'react';
import {
Box,
Drawer,
AppBar,
Toolbar,
List,
IconButton,
ListItem,
ListItemButton,
ListItemIcon,
ListItemText,
useTheme,
Collapse,
ToggleButtonGroup,
ToggleButton,
} from '@mui/material';
import {
Menu as MenuIcon,
Home as HomeIcon,
BarChart as StatsIcon,
ManageAccounts,
CalendarMonth as ScheduleIcon,
Book as SubjectIcon,
Business as SchoolIcon,
Grade,
EventBusy as AbsenceIcon,
Report as ComplaintIcon,
Logout,
Work as Teacher,
EscalatorWarning as ParentIcon,
School as StudentIcon,
ChevronLeft as ChevronLeftIcon,
AccountCircle as ProfileIcon,
} from '@mui/icons-material';

import logo from '../../public/EduTrack_logo_positive.svg';
import useAuth from '../hooks/useAuth';
import { useMediaQuery } from "@mui/material";
import { Link } from 'react-router-dom';
import { useStudent } from '../context/StudentContext';
import { useTranslation } from 'react-i18next';
import { useSidebar } from '../context/SidebarContext';
import '../styles/sidebar.css';

const drawerWidth = 240;

const Sidebar = () => {
    const { user } = useAuth();
    const { t, i18n } = useTranslation();

    const { students, setSelectedStudent } = useStudent();
    const { desktopOpen, setDesktopOpen } = useSidebar();

    const [mobileOpen, setMobileOpen] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const [openMenu, setOpenMenu] = useState(null);

    const handleParentEnter = (key) => {
        if (!isMobile) setOpenMenu(key);
    };

    const handleParentLeave = () => {
        if (!isMobile) setOpenMenu(null);
    };

    const handleParentClick = (key, hasSubmenu) => {
        if (isMobile && hasSubmenu) {
            setOpenMenu(openMenu === key ? null : key);
        }
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const menuItems = {
        ADMIN : [
            {key: "home", label: t('nav.home'), icon: <HomeIcon />, to: "/"},
            {
                key: "statistics",
                label: t('nav.statistics'),
                icon: <StatsIcon />,
                submenu: [
                    {key: "schoolStats", label: t('nav.schoolStatistics'), to: "/select/school/statistics"},
                    {key: "teacherStats", label: t('nav.teacherStatistics'), to: "/select/teacher/statistics"},
                    {key: "subjectStats", label: t('nav.subjectStatistics'), to: "/select/subject/statistics"}
                ]
            },
            {key: "schools", label: t('nav.schools'), icon: <SchoolIcon />, to: "/admin/viewSchools"},
            {key: "manageUsers", label: t('nav.manageUsers'), icon: <ManageAccounts />, to: "/admin/manageUsers"},
            {key: "schedules", label: t('nav.schedules'), icon: <ScheduleIcon />, to: "/select/class/schedule"},
            {key: "subjects", label: t('nav.subjects'), icon: <SubjectIcon />, to: "/admin/viewSubjects"},
            {key: "profile", label: t('nav.profile'), icon: <ProfileIcon />, to: "/profile"},
            {key: "logout", label: t('nav.logout'), icon: <Logout />, to: "/login"}
        ],
        HEADMASTER : [
            {key: "home", label: t('nav.home'), icon: <HomeIcon />, to: "/"},
            {key: "mySchool", label: t('nav.mySchool'), icon: <SchoolIcon />, to: "/headmaster/mySchool"},
            {key: "schedules", label: t('nav.schedules'), icon: <ScheduleIcon />, to: "/select/class/schedule"},
            {key: "subjects", label: t('nav.subjects'), icon: <SubjectIcon />, to: "/admin/viewSubjects"},
            {key: "grades", label: t('nav.grades'), icon: <Grade />, to: "/select/class/grades"},
            {key: "absences", label: t('nav.absences'), icon: <AbsenceIcon />, to: "/select/class/absences"},
            {key: "teachers", label: t('nav.teachers'), icon: <Teacher />, to: "/headmaster/viewTeachers"},
            {key: "parents", label: t('nav.parents'), icon: <ParentIcon />, to: "/headmaster/viewParents"},
            {key: "students", label: t('nav.students'), icon: <StudentIcon />, to: "/headmaster/viewStudents"},
            {key: "profile", label: t('nav.profile'), icon: <ProfileIcon />, to: "/profile"},
            {key: "logout", label: t('nav.logout'), icon: <Logout />, to: "/login"}
        ],
        TEACHER : [
            {key: "home", label: t('nav.home'), icon: <HomeIcon />, to: "/"},
            {key: "mySchool", label: t('nav.mySchool'), icon: <SchoolIcon />, to: "/teacher/school"},
            {key: "schedule", label: t('nav.schedule'), icon: <ScheduleIcon />, to: "/teacher/teacherSchedule/:teacherId"},
            {key: "grades", label: t('nav.grades'), icon: <Grade />, to: "/select/class/grades"},
            {key: "absences", label: t('nav.absences'), icon: <AbsenceIcon />, to: "/select/class/absences"},
            {key: "complaints", label: t('nav.complaints'), icon: <ComplaintIcon />, to: "/select/class/complaints"},
            {key: "profile", label: t('nav.profile'), icon: <ProfileIcon />, to: "/profile"},
            {key: "logout", label: t('nav.logout'), icon: <Logout />, to: "/login"}
        ],
        PARENT: [
            {key: "home", label: t('nav.home'), icon: <HomeIcon />, to: "/"},
            {key: "schedule", label: t('nav.schedule'), icon: <ScheduleIcon />, to: "/schedule/:classId"},
            {key: "grades", label: t('nav.grades'), icon: <Grade />, to: "/grades/me"},
            {key: "absences", label: t('nav.absences'), icon: <AbsenceIcon />, to: "/absences/me"},
            {key: "complaints", label: t('nav.complaints'), icon: <ComplaintIcon />, to: "/complaints/:studentId"},
            {
                key: "viewStudent",
                label: t('nav.viewStudent'),
                icon: <StudentIcon />,
                submenu: students.map(s => ({
                    label: s.name,
                    key: s.id,
                    to: "#",
                    onClick: () => setSelectedStudent(s)
                }))
            },
            {key: "profile", label: t('nav.profile'), icon: <ProfileIcon />, to: "/profile"},
            {key: "logout", label: t('nav.logout'), icon: <Logout />, to: "/login"}
        ],
        STUDENT: [
            {key: "home", label: t('nav.home'), icon: <HomeIcon />, to: "/"},
            {key: "schedule", label: t('nav.schedule'), icon: <ScheduleIcon />, to: "/schedule/:classId"},
            {key: "grades", label: t('nav.grades'), icon: <Grade />, to: "/grades/me"},
            {key: "absences", label: t('nav.absences'), icon: <AbsenceIcon />, to: "/absences/me"},
            {key: "complaints", label: t('nav.complaints'), icon: <ComplaintIcon />, to: "/complaints/:studentId"},
            {key: "profile", label: t('nav.profile'), icon: <ProfileIcon />, to: "/profile"},
            {key: "logout", label: t('nav.logout'), icon: <Logout />, to: "/login"}
        ]
    };

    const drawerContent = (
    <>
        {/* Header row: logo + close button */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
            <img src={logo} alt="logo" className="sidebar-logo" />
            <IconButton
                onClick={() => setDesktopOpen(false)}
                sx={{ display: { xs: 'none', md: 'flex' }, color: 'inherit' }}
            >
                <ChevronLeftIcon />
            </IconButton>
        </Box>

        <List>
            {menuItems[user.role].map((item) => (
                <Box
                    key={item.key}
                    onMouseEnter={() => handleParentEnter(item.key)}
                    onMouseLeave={() => handleParentLeave()}
                >
                    <ListItem disablePadding>
                        <ListItemButton
                            component={item.to ? Link : "div"}
                            to={item.submenu ? undefined : item.to}
                            onClick={() => {
                                if (item.submenu) {
                                    handleParentClick(item.key, true);
                                } else {
                                    if (isMobile) setMobileOpen(false);
                                }
                            }}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.label} />
                        </ListItemButton>
                    </ListItem>

                    {/* SUBMENU */}
                    {item.submenu && (
                        <Collapse in={openMenu === item.key} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                {item.submenu.map((sub) => (
                                    <ListItem key={sub.key || sub.label} disablePadding sx={{ pl: 4 }}>
                                        <ListItemButton
                                            component={sub.to ? Link : "button"}
                                            to={sub.to}
                                            onClick={() => {
                                                sub.onClick?.();
                                                if (isMobile) {
                                                    setMobileOpen(false);
                                                    setOpenMenu(null);
                                                }
                                            }}
                                        >
                                            <ListItemText primary={sub.label} />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </Collapse>
                    )}
                </Box>
            ))}
        </List>

        <Box sx={{ mt: 'auto', mb: 2, display: 'flex', justifyContent: 'center' }}>
            <ToggleButtonGroup
                value={i18n.language}
                exclusive
                size="small"
                onChange={(_, lng) => { if (lng) i18n.changeLanguage(lng); }}
            >
                <ToggleButton value="en">EN</ToggleButton>
                <ToggleButton value="bg">BG</ToggleButton>
            </ToggleButtonGroup>
        </Box>
    </>
    );

    return (
    <Box sx={{ display: 'flex' }}>
        {/* Mobile AppBar */}
        <AppBar
            position="fixed"
            sx={{
                display: { xs: 'block', md: 'none' },
                width: '100%',
            }}
        >
            <Toolbar>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={handleDrawerToggle}
                    sx={{ mr: 2 }}
                >
                    <MenuIcon />
                </IconButton>
            </Toolbar>
        </AppBar>

        {/* Desktop reopen button — only visible when sidebar is closed */}
        {!desktopOpen && (
            <IconButton
                onClick={() => setDesktopOpen(true)}
                sx={{
                    display: { xs: 'none', md: 'flex' },
                    position: 'fixed',
                    top: 12,
                    left: 12,
                    zIndex: (t) => t.zIndex.drawer + 1,
                    bgcolor: 'primary.main',
                    color: 'secondary.contrastText',
                    '&:hover': { bgcolor: 'primary.dark' },
                }}
            >
                <MenuIcon />
            </IconButton>
        )}

        <Box component="nav" sx={{ flexShrink: { md: 0 } }}>
            {/* Mobile drawer (temporary) */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: drawerWidth,
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                    },
                }}
            >
                {drawerContent}
            </Drawer>

            {/* Desktop drawer (permanent, collapsible via width animation) */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', md: 'block' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: desktopOpen ? drawerWidth : 0,
                        transition: theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: desktopOpen
                                ? theme.transitions.duration.enteringScreen
                                : theme.transitions.duration.leavingScreen,
                        }),
                        overflow: 'hidden',
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        display: 'flex',
                        flexDirection: 'column',
                    },
                }}
                open
            >
                {drawerContent}
            </Drawer>
        </Box>
    </Box>
    );
};

export default Sidebar;
