import React from 'react';
import { Box, useTheme } from '@mui/material';
import Sidebar from './Sidebar';
import { SidebarProvider, useSidebar } from '../context/SidebarContext';

const drawerWidth = 240;

function LayoutContent({ children }) {
  const { desktopOpen } = useSidebar();
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          ml: {
            xs: 0,
            md: desktopOpen ? `${drawerWidth}px` : 0,
          },
          transition: theme.transitions.create('margin-left', {
            easing: desktopOpen
              ? theme.transitions.easing.easeOut
              : theme.transitions.easing.sharp,
            duration: desktopOpen
              ? theme.transitions.duration.enteringScreen
              : theme.transitions.duration.leavingScreen,
          }),
          mt: { xs: '56px', md: 0 },
          p: 3,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default function Layout({ children }) {
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}
