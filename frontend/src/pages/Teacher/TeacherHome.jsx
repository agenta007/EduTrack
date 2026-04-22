import React from 'react';
import { Box, Button } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import WelcomeBanner from '../../components/WelcomeBanner';

function TeacherHome() {
  return (
    <Layout>
      <WelcomeBanner />
      <Box sx={{ px: 3, pt: 2 }}>
      </Box>
    </Layout>
  );
}

export default TeacherHome;
