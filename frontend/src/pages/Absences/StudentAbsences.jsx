import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Chip, CircularProgress, Paper, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Typography,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import api from '../../api/axiosInstance';
import useAuth from '../../hooks/useAuth';

function StudentAbsences() {
  const { studentId } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [absences, setAbsences] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [termTab, setTermTab]   = useState(0);

  useEffect(() => {
    const url = user?.role === 'STUDENT'
      ? '/api/absences/student/me'
      : `/api/absences/student/${studentId}`;
    api.get(url)
      .then(res => setAbsences(res.data))
      .catch(() => setError(t('absences.fetchError')))
      .finally(() => setLoading(false));
  }, [studentId]);

  const termFilter = termTab === 0 ? null : termTab;
  const filtered = termFilter ? absences.filter(a => a.term === termFilter) : absences;
  const excusedCount = filtered.filter(a => a.excused).length;

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>{t('absences.title')}</Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
        ) : (
          <>
            <Tabs value={termTab} onChange={(_, v) => setTermTab(v)} sx={{ mb: 1 }}>
              <Tab label={t('grades.all')} />
              <Tab label={t('schedule.term1')} />
              <Tab label={t('schedule.term2')} />
            </Tabs>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip label={`${t('absences.total')}: ${filtered.length}`} />
              <Chip label={`${t('absences.excusedCount')}: ${excusedCount}`} color="success" variant="outlined" />
              <Chip label={`${t('absences.unexcusedCount')}: ${filtered.length - excusedCount}`} color="error" variant="outlined" />
            </Box>

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('absences.subject')}</TableCell>
                    <TableCell>{t('absences.teacher')}</TableCell>
                    <TableCell>{t('absences.term')}</TableCell>
                    <TableCell>{t('absences.date')}</TableCell>
                    <TableCell>{t('absences.excused')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">{t('absences.noAbsences')}</TableCell>
                    </TableRow>
                  ) : (
                    filtered.map(a => (
                      <TableRow key={a.id} hover>
                        <TableCell>{a.subjectName}</TableCell>
                        <TableCell>{a.teacherName}</TableCell>
                        <TableCell>{a.term}</TableCell>
                        <TableCell>{a.date}</TableCell>
                        <TableCell>
                          <Chip
                            label={a.excused ? t('absences.excused') : t('absences.unexcused')}
                            size="small"
                            color={a.excused ? 'success' : 'error'}
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Box>
    </Layout>
  );
}

export default StudentAbsences;
