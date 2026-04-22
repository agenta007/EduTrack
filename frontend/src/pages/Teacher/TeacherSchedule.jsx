import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Chip, CircularProgress, Paper,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import api from '../../api/axiosInstance';

// ── Term-activity helpers ─────────────────────────────────────────────────────

const DEFAULT_CONFIG = {
  startDate:       '09-15',
  term2Start:      '02-01',
  elementaryEnd:   '06-01',
  progymnasiumEnd: '06-15',
  gymnasiumEnd:    '07-01',
};

/** Parse a "MM-dd" string into a Date for the given year. */
// Converts a month-day string into a full JavaScript Date object
const parseMMDD = (mmdd, year) => {
  // Split the "MM-DD" string by hyphen and convert parts to integers
  const [m, d] = mmdd.split('-').map(Number);
  // Return a new Date using the provided year, zero-indexed month, and day
  return new Date(year, m - 1, d);
};

/**
 * Return the calendar year in which the current school year STARTED.
 * School years straddle two calendar years (e.g. 2024/2025 starts in 2024).
 */
// Determine the start year of the current school year based on a given start date
const schoolYearStartYear = (today, startDate) => {
  // Parse the month and day from the YYYY-MM-DD string format
  const [m, d] = startDate.split('-').map(Number);
  // Get the current calendar year
  const y = today.getFullYear();
  // If the current date has reached or passed the start date in the current year, return current year; otherwise, return the previous year
  return today >= new Date(y, m - 1, d) ? y : y - 1;
};

/**
 * Return 1, 2, or null (null = not in session).
 * term2Start and end dates are always in startYear+1 (the "spring" half).
 */
const getActiveTerm = (today, cfg) => {
  // Determine which academic year the current date belongs to
  const sy = schoolYearStartYear(today, cfg.startDate);
  // Calculate the start date of the first term for the current school year
  const start = parseMMDD(cfg.startDate, sy);
  // Calculate the start date of the second term for the following school year
  const t2    = parseMMDD(cfg.term2Start, sy + 1);
  // If the current date is before the start of the first term, no term is active
  if (today < start) return null;
  // If the current date is before the start of the second term, we are in term 1
  if (today < t2)    return 1;
  // Otherwise, the current date falls within the second term
  return 2;
};

/** True if the entry belongs to the active term and its grade level hasn't ended yet. */
// Determines if a specific schedule entry is valid for the current academic term and date
const isEntryActive = (entry, today, cfg, activeTerm) => {
  // Validate that the entry belongs to the currently active school term
  if (activeTerm === null || entry.term !== activeTerm) return false;

  // Extract the numeric grade level from the class name (e.g., "5.A" -> 5)
  const grade = parseInt(entry.className.match(/^(\d+)/)?.[1] ?? '0');

  // Determine the academic year end date based on the student's grade level category
  const endStr = grade <= 4 ? cfg.elementaryEnd
               : grade <= 7 ? cfg.progymnasiumEnd
               : cfg.gymnasiumEnd;

  // Calculate the start of the current school year
  const sy  = schoolYearStartYear(today, cfg.startDate);

  // Parse the end date string using the calculated school year context
  const end = parseMMDD(endStr, sy + 1);

  // The entry is active if the current date has not yet passed the term's end date
  return today <= end;
};

// ── Component ─────────────────────────────────────────────────────────────────

function TeacherSchedule() {
  const { t }    = useTranslation();
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [config,  setConfig]  = useState(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/api/schedules/teacher/me'),
      api.get('/api/profile'),
    ])
      .then(([schedRes, profileRes]) => {
        setEntries(schedRes.data);
        const schoolId = profileRes.data.schoolId;
        if (schoolId) {
          return api.get(`/api/schools/${schoolId}/term-config`)
            .then(res => setConfig(res.data))
            .catch(() => {}); // keep defaults on error
        }
      })
      .catch(() => setError(t('schedule.fetchError')))
      .finally(() => setLoading(false));
  }, []);

  const today      = useMemo(() => new Date(), []);
  const activeTerm = useMemo(() => getActiveTerm(today, config), [today, config]);

  const activeEntries = useMemo(
    () => entries.filter(e => isEntryActive(e, today, config, activeTerm)),
    [entries, today, config, activeTerm]
  );

  const termLabel = activeTerm === 1 ? t('schedule.term1')
                  : activeTerm === 2 ? t('schedule.term2')
                  : null;

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Typography variant="h5">{t('schedule.mySchedule')}</Typography>
          {termLabel && (
            <Chip label={termLabel} color="success" size="small" />
          )}
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : activeTerm === null ? (
          <Typography color="text.secondary">{t('schedule.notInSession')}</Typography>
        ) : activeEntries.length === 0 ? (
          <Typography color="text.secondary">{t('schedule.noEntries')}</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('schedule.dayOfWeek')}</TableCell>
                  <TableCell>{t('schedule.startTime')}</TableCell>
                  <TableCell>{t('schedule.endTime')}</TableCell>
                  <TableCell>{t('schedule.class')}</TableCell>
                  <TableCell>{t('schedule.subject')}</TableCell>
                  <TableCell>{t('schedule.school')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...activeEntries]
                  .sort((a, b) =>
                    a.dayOfWeek !== b.dayOfWeek
                      ? a.dayOfWeek - b.dayOfWeek
                      : (a.startTime ?? '').localeCompare(b.startTime ?? '')
                  )
                  .map(e => (
                    <TableRow
                      key={e.id}
                      hover
                      sx={{ cursor: 'pointer', bgcolor: '#f1f8e9' }}
                      onClick={() => navigate(`/schedule/${e.classId}`)}
                    >
                      <TableCell sx={{ color: 'success.dark' }}>{t(`schedule.days.${e.dayOfWeek}`)}</TableCell>
                      <TableCell sx={{ color: 'success.dark' }}>{e.startTime?.slice(0, 5)}</TableCell>
                      <TableCell sx={{ color: 'success.dark' }}>{e.endTime?.slice(0, 5)}</TableCell>
                      <TableCell sx={{ color: 'success.dark', fontWeight: 500 }}>{e.className}</TableCell>
                      <TableCell sx={{ color: 'success.dark' }}>{e.subjectName}</TableCell>
                      <TableCell sx={{ color: 'success.dark' }}>{e.schoolName}</TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Layout>
  );
}

export default TeacherSchedule;
