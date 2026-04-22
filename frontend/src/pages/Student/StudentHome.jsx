import React from 'react'
import { Box, Button } from '@mui/material'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import WelcomeBanner from '../../components/WelcomeBanner'

function StudentHome() {
  const navigate = useNavigate()
  return (
    <Layout>
      <WelcomeBanner />
      <Box sx={{ px: 3, pt: 2 }}>
        <Button
          variant="outlined"
          startIcon={<CalendarMonthIcon />}
          onClick={() => navigate('/student/calendar')}
        >
          My Calendar
        </Button>
      </Box>
    </Layout>
  )
}

export default StudentHome
