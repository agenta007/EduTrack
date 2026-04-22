import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, IconButton, InputLabel,
  MenuItem, Paper, Select, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tabs, TextField, Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import api from '../../api/axiosInstance';
import useAuth from '../../hooks/useAuth';

const fieldSx = {
  InputProps: { sx: { color: 'black' } },
  InputLabelProps: { shrink: true, sx: { color: 'black', '&.Mui-focused': { color: 'black' } } },
};

function ClassAbsences() {
  const { classId } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const canEdit = ['ADMIN', 'HEADMASTER', 'TEACHER'].includes(user?.role);

  const [classInfo, setClassInfo] = useState(null);
  const [absences, setAbsences]   = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [students, setStudents]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [termTab, setTermTab]     = useState(0);

  const [addOpen, setAddOpen]     = useState(false);
  const [addForm, setAddForm]     = useState({ studentId: '', scheduleId: '', date: '' });
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/api/classes/${classId}`),
      api.get(`/api/absences/class/${classId}`),
      api.get(`/api/schedules/class/${classId}`),
      api.get(`/api/classes/${classId}/students`),
    ])
      .then(([ci, ab, sc, st]) => {
        setClassInfo(ci.data);
        setAbsences(ab.data);
        setSchedules(sc.data);
        setStudents(st.data);
      })
      .catch(() => setError(t('absences.fetchError')))
      .finally(() => setLoading(false));
  }, [classId]);

  const termFilter = termTab === 0 ? null : termTab;
  const filtered = termFilter ? absences.filter(a => a.term === termFilter) : absences;
  const excusedCount = filtered.filter(a => a.excused).length;

  const handleAdd = () => {
    setSaving(true);
    api.post('/api/absences', {
      studentId: Number(addForm.studentId),
      scheduleId: Number(addForm.scheduleId),
      date: addForm.date,
    })
      .then(res => {
        setAbsences(prev => [...prev, res.data]);
        setAddOpen(false);
        setAddForm({ studentId: '', scheduleId: '', date: '' });
      })
      .catch(() => setError(t('absences.createError')))
      .finally(() => setSaving(false));
  };

  const handleExcuse = (id) => {
    api.put(`/api/absences/${id}/excuse`)
      .then(res => setAbsences(prev => prev.map(a => a.id === id ? res.data : a)))
      .catch(() => setError(t('absences.fetchError')));
  };

  const handleDelete = (id) => {
    api.delete(`/api/absences/${id}`)
      .then(() => setAbsences(prev => prev.filter(a => a.id !== id)))
      .catch(() => setError(t('absences.deleteError')));
  };

  const isAddValid = addForm.studentId && addForm.scheduleId && addForm.date;

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
                  {t('absences.title')} — {classInfo?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">{classInfo?.schoolName}</Typography>
              </Box>
              {canEdit && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
                  {t('absences.addAbsence')}
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
              <Chip label={`${t('absences.total')}: ${filtered.length}`} />
              <Chip label={`${t('absences.excusedCount')}: ${excusedCount}`} color="success" variant="outlined" />
              <Chip label={`${t('absences.unexcusedCount')}: ${filtered.length - excusedCount}`} color="error" variant="outlined" />
            </Box>

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('absences.student')}</TableCell>
                    <TableCell>{t('absences.subject')}</TableCell>
                    <TableCell>{t('absences.teacher')}</TableCell>
                    <TableCell>{t('absences.term')}</TableCell>
                    <TableCell>{t('absences.date')}</TableCell>
                    <TableCell>{t('absences.excused')}</TableCell>
                    {canEdit && <TableCell align="center">{t('schools.actions')}</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canEdit ? 7 : 6} align="center">{t('absences.noAbsences')}</TableCell>
                    </TableRow>
                  ) : (
                    filtered.map(a => (
                      <TableRow key={a.id} hover>
                        <TableCell>{a.studentName}</TableCell>
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
                        {canEdit && (
                          <TableCell align="center">
                            <IconButton size="small" onClick={() => handleExcuse(a.id)} title={a.excused ? t('absences.unexcuse') : t('absences.excuse')}>
                              <CheckIcon fontSize="small" sx={{ color: a.excused ? 'grey.500' : 'green' }} />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(a.id)}>
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
        <DialogTitle>{t('absences.addAbsence')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: 'black', '&.Mui-focused': { color: 'black' } }}>{t('absences.student')}</InputLabel>
            <Select value={addForm.studentId} onChange={e => setAddForm(f => ({ ...f, studentId: e.target.value }))}
              label={t('absences.student')} sx={{ color: 'black' }}>
              {students.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel sx={{ color: 'black', '&.Mui-focused': { color: 'black' } }}>{t('absences.subject')}</InputLabel>
            <Select value={addForm.scheduleId} onChange={e => setAddForm(f => ({ ...f, scheduleId: e.target.value }))}
              label={t('absences.subject')} sx={{ color: 'black' }}>
              {schedules.map(s => (
                <MenuItem key={s.id} value={s.id}>
                  {s.subjectName} — {t('schedule.term')} {s.term}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={t('absences.date')} type="date" value={addForm.date}
            onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))}
            fullWidth {...fieldSx}
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

export default ClassAbsences;
