import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Chip, CircularProgress, Divider, Paper,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import api from '../../api/axiosInstance';

const ENTRY_TYPE_COLORS = {
  LECTURE: 'primary',
  BREAK: 'default',
  SPECIAL_EVENT: 'warning',
};

function TeacherSchool() {
  const { t } = useTranslation();

  const [school, setSchool] = useState(null);
  const [scheduleEntries, setScheduleEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/profile')
      .then(res => {
        const schoolId = res.data.schoolId;
        if (!schoolId) throw new Error('No school assigned');
        return Promise.all([
          api.get(`/api/schools/${schoolId}`),
          api.get(`/api/schools/${schoolId}/schedule`),
        ]);
      })
      .then(([schoolRes, schedRes]) => {
        setSchool(schoolRes.data);
        setScheduleEntries(schedRes.data);
      })
      .catch(() => setError(t('schools.fetchError')))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : school && (
          <>
            <Typography variant="h5" sx={{ mb: 0.5 }}>{school.name}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{school.address}</Typography>
            {school.type && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {t(`schoolTypes.${school.type}`)}
              </Typography>
            )}
            {school.headmasterName && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('schools.headmaster')}: {school.headmasterName}
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ mb: 1 }}>{t('schools.dailySchedule')}</Typography>

            {scheduleEntries.length === 0 ? (
              <Typography variant="body2" color="text.secondary">{t('schools.noScheduleEntries')}</Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('schools.entryType')}</TableCell>
                      <TableCell>{t('schools.entryLabel')}</TableCell>
                      <TableCell>{t('schools.startTime')}</TableCell>
                      <TableCell>{t('schools.endTime')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scheduleEntries.map(e => (
                      <TableRow key={e.id} hover>
                        <TableCell>
                          <Chip
                            label={t(`entryTypes.${e.type}`)}
                            size="small"
                            color={ENTRY_TYPE_COLORS[e.type] || 'default'}
                          />
                        </TableCell>
                        <TableCell>{e.label}</TableCell>
                        <TableCell>{e.startTime}</TableCell>
                        <TableCell>{e.endTime}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Box>
    </Layout>
  );
}

export default TeacherSchool;
