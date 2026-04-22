import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Chip, CircularProgress, Divider, Paper, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Typography,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import api from '../../api/axiosInstance';
import useAuth from '../../hooks/useAuth';

const GRADE_COLOR = v => {
  // Map a numeric grade to a Material UI alert/text severity
  const n = parseFloat(v);
  // High grades (5.5 - 6.0) use green success color
  if (n >= 5.5) return 'success';
  // Good grades (4.0 - 5.0) use blue primary color
  if (n >= 4) return 'primary';
  // Passing/Borderline grades (2.0 - 3.5) use orange warning color
  if (n <= 3) return 'warning';
  // Failing grades (below 2.0) use red error color
  return 'error';
};

function StudentGrades() {
  const { studentId } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [grades, setGrades]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [termTab, setTermTab] = useState(0);

  useEffect(() => {
    const url = user?.role === 'STUDENT'
      ? '/api/grades/student/me'
      : `/api/grades/student/${studentId}`;
    api.get(url)
      .then(res => setGrades(res.data))
      .catch(() => setError(t('grades.fetchError')))
      .finally(() => setLoading(false));
  }, [studentId]);

  const termFilter = termTab === 0 ? null : termTab;
  const filtered = termFilter ? grades.filter(g => g.term === termFilter) : grades;

  const avg = filtered.length
    ? (filtered.reduce((s, g) => s + parseFloat(g.value), 0) / filtered.length).toFixed(2)
    : null;

  const subjectAverages = useMemo(() => {
    const map = {};
    filtered.forEach(g => {
      if (!map[g.subjectId]) map[g.subjectId] = { name: g.subjectName, sum: 0, count: 0 };
      map[g.subjectId].sum   += parseFloat(g.value);
      map[g.subjectId].count += 1;
    });
    return Object.values(map)
      .map(s => ({ name: s.name, avg: (s.sum / s.count).toFixed(2) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered]);

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>{t('grades.title')}</Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
        ) : (
          <>
            <Tabs value={termTab} onChange={(_, v) => setTermTab(v)} sx={{ mb: 2 }}>
              <Tab label={t('grades.all')} />
              <Tab label={t('schedule.term1')} />
              <Tab label={t('schedule.term2')} />
            </Tabs>

            {subjectAverages.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  {t('grades.average')}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {subjectAverages.map(s => (
                    <Chip
                      key={s.name}
                      label={`${s.name}: ${s.avg}`}
                      color={GRADE_COLOR(s.avg)}
                      variant="outlined"
                    />
                  ))}
                </Box>
                <Divider sx={{ mb: 1.5 }} />
                <Chip
                  label={`${t('grades.average')} (${t('grades.all')}): ${avg}`}
                  color={GRADE_COLOR(avg)}
                />
              </Box>
            )}

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('grades.subject')}</TableCell>
                    <TableCell>{t('grades.teacher')}</TableCell>
                    <TableCell>{t('grades.term')}</TableCell>
                    <TableCell>{t('grades.value')}</TableCell>
                    <TableCell>{t('grades.date')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">{t('grades.noGrades')}</TableCell>
                    </TableRow>
                  ) : (
                    filtered.map(g => (
                      <TableRow key={g.id} hover>
                        <TableCell>{g.subjectName}</TableCell>
                        <TableCell>{g.teacherName}</TableCell>
                        <TableCell>{g.term}</TableCell>
                        <TableCell>
                          <Chip label={g.value} size="small" color={GRADE_COLOR(g.value)} />
                        </TableCell>
                        <TableCell>{g.createdAt?.slice(0, 10)}</TableCell>
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

export default StudentGrades;
