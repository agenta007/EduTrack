import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, IconButton, InputLabel,
  MenuItem, Paper, Select, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import api from '../../api/axiosInstance';
import useAuth from '../../hooks/useAuth';

const fieldSx = {
  InputProps: { sx: { color: 'black' } },
  InputLabelProps: { shrink: true, sx: { color: 'black', '&.Mui-focused': { color: 'black' } } },
};

/** Returns the Monday–Friday dates of the week containing `date`. */
function getWeekDays(date) {
  // Initialize a new date object from the provided input to avoid mutating the original
  const d = new Date(date);
  // Retrieve the day of the week (0 for Sunday, 1 for Monday, etc.)
  const day = d.getDay(); // 0=Sun…6=Sat
  // Create a reference date for the start of the week
  const monday = new Date(d);
  // Calculate and set the date to the most recent Monday
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  // Generate an array representing the first 5 weekdays (Monday to Friday)
  return Array.from({ length: 5 }, (_, i) => {
    // Clone the Monday reference date for each iteration
    const dd = new Date(monday);
    // Offset the date by the current index to traverse the week
    dd.setDate(monday.getDate() + i);
    return dd;
  });
}

/** Format a Date as "yyyy-MM-dd" */
// Converts a Date object to a YYYY-MM-DD string format
function toISODate(d) {
  // Extract the date portion from the full ISO string
  return d.toISOString().slice(0, 10);
}

/** day-of-week index the DB uses: Mon=1…Fri=5 */
function dbDayOfWeek(date) {
  // Convert JavaScript 0-6 (Sun-Sat) to database-compatible 1-7 (Mon-Sun) format
  const js = date.getDay(); // 0=Sun…6=Sat
  // Map Sunday from 0 to 7, leaving other days unchanged
  return js === 0 ? 7 : js; // Sun→7, Mon→1…Fri→5  (only 1-5 are valid)
}

const DAY_LABELS = ['', 'Пон', 'Вт', 'Ср', 'Чет', 'Пет'];
const DAY_LABELS_EN = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function ClassComplaints() {
  const { classId } = useParams();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const canEdit = ['ADMIN', 'HEADMASTER', 'TEACHER'].includes(user?.role);

  const [classInfo, setClassInfo]   = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [schedules, setSchedules]   = useState([]);
  const [students, setStudents]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [termTab, setTermTab]       = useState(0);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ studentId: '', scheduleId: '', date: toISODate(new Date()), description: '' });
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/api/classes/${classId}`),
      api.get(`/api/complaints/class/${classId}`),
      api.get(`/api/schedules/class/${classId}`),
      api.get(`/api/classes/${classId}/students`),
    ])
      .then(([ci, cp, sc, st]) => {
        setClassInfo(ci.data);
        setComplaints(cp.data);
        setSchedules(sc.data);
        setStudents(st.data);
      })
      .catch(() => setError(t('complaints.fetchError')))
      .finally(() => setLoading(false));
  }, [classId]);

  // Week days for the current week
  const weekDays = useMemo(() => getWeekDays(new Date()), []);

  // Schedules for the selected date's day-of-week
  const selectedDayOfWeek = dbDayOfWeek(new Date(addForm.date + 'T00:00:00'));
  const daySchedules = schedules.filter(s => s.dayOfWeek === selectedDayOfWeek);

  // Reset scheduleId when the day changes and the current selection is no longer valid
  const handleDateSelect = (dateStr) => {
    setAddForm(f => ({ ...f, date: dateStr, scheduleId: '' }));
  };

  const termFilter = termTab === 0 ? null : termTab;
  const filtered = termFilter
    ? complaints.filter(c => c.term === termFilter)
    : complaints;

  const handleAdd = () => {
    setSaving(true);
    api.post('/api/complaints', {
      studentId:   Number(addForm.studentId),
      scheduleId:  Number(addForm.scheduleId),
      date:        addForm.date,
      description: addForm.description,
    })
      .then(res => {
        setComplaints(prev => [...prev, res.data]);
        setAddOpen(false);
        setAddForm({ studentId: '', scheduleId: '', date: toISODate(new Date()), description: '' });
      })
      .catch(() => setError(t('complaints.createError')))
      .finally(() => setSaving(false));
  };

  const handleDelete = (id) => {
    api.delete(`/api/complaints/${id}`)
      .then(() => setComplaints(prev => prev.filter(c => c.id !== id)))
      .catch(() => setError(t('complaints.deleteError')));
  };

  const isAddValid = addForm.studentId && addForm.scheduleId && addForm.date && addForm.description.trim();

  const dayLabels = i18n.language === 'bg' ? DAY_LABELS : DAY_LABELS_EN;

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography variant="h5">
                  {t('complaints.title')} — {classInfo?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">{classInfo?.schoolName}</Typography>
              </Box>
              {canEdit && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
                  {t('complaints.addComplaint')}
                </Button>
              )}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Tabs value={termTab} onChange={(_, v) => setTermTab(v)} sx={{ mb: 1 }}>
              <Tab label={t('grades.all')} />
              <Tab label={t('schedule.term1')} />
              <Tab label={t('schedule.term2')} />
            </Tabs>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip label={`${t('complaints.total')}: ${filtered.length}`} />
            </Box>

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('complaints.student')}</TableCell>
                    <TableCell>{t('complaints.subject')}</TableCell>
                    <TableCell>{t('complaints.teacher')}</TableCell>
                    <TableCell>{t('complaints.term')}</TableCell>
                    <TableCell>{t('complaints.date')}</TableCell>
                    <TableCell>{t('complaints.description')}</TableCell>
                    {canEdit && <TableCell align="center">{t('schools.actions')}</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canEdit ? 7 : 6} align="center">{t('complaints.noComplaints')}</TableCell>
                    </TableRow>
                  ) : (
                    filtered.map(c => (
                      <TableRow key={c.id} hover>
                        <TableCell>{c.studentName}</TableCell>
                        <TableCell>{c.subjectName}</TableCell>
                        <TableCell>{c.teacherName}</TableCell>
                        <TableCell>{c.term}</TableCell>
                        <TableCell>{c.date}</TableCell>
                        <TableCell>{c.description}</TableCell>
                        {canEdit && (
                          <TableCell align="center">
                            <IconButton size="small" onClick={() => handleDelete(c.id)}>
                              <DeleteIcon fontSize="small" sx={{ color: 'red' }} />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Box>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('complaints.addComplaint')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>

          {/* Student picker */}
          <FormControl fullWidth>
            <InputLabel sx={{ color: 'black', '&.Mui-focused': { color: 'black' } }}>{t('complaints.student')}</InputLabel>
            <Select value={addForm.studentId} onChange={e => setAddForm(f => ({ ...f, studentId: e.target.value }))}
              label={t('complaints.student')} sx={{ color: 'black' }}>
              {students.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>

          {/* Current-week day selector */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              {t('complaints.pickDay')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {weekDays.map((d, i) => {
                const iso = toISODate(d);
                const isSelected = addForm.date === iso;
                return (
                  <Button
                    key={iso}
                    variant={isSelected ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => handleDateSelect(iso)}
                    sx={{ minWidth: 56, flexDirection: 'column', py: 0.5, lineHeight: 1.2 }}
                  >
                    <span style={{ fontSize: '0.7rem' }}>{dayLabels[i + 1]}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{d.getDate()}</span>
                  </Button>
                );
              })}
            </Box>
          </Box>

          {/* Subject filtered by selected day's schedule */}
          <FormControl fullWidth>
            <InputLabel sx={{ color: 'black', '&.Mui-focused': { color: 'black' } }}>{t('complaints.subject')}</InputLabel>
            <Select value={addForm.scheduleId} onChange={e => setAddForm(f => ({ ...f, scheduleId: e.target.value }))}
              label={t('complaints.subject')} sx={{ color: 'black' }}
              disabled={daySchedules.length === 0}>
              {daySchedules.length === 0
                ? <MenuItem value="" disabled>{t('complaints.noSubjectsToday')}</MenuItem>
                : daySchedules.map(s => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.startTime} — {s.subjectName} ({s.teacherName})
                    </MenuItem>
                  ))
              }
            </Select>
          </FormControl>

          {/* Description */}
          <TextField
            label={t('complaints.description')} value={addForm.description}
            onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
            multiline rows={3} fullWidth {...fieldSx}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleAdd} disabled={!isAddValid || saving}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}

export default ClassComplaints;
