import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, FormControlLabel,
  IconButton, InputLabel, MenuItem, Paper, Select, Switch, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon    from '@mui/icons-material/Add';

const TYPE_COLORS = { STANDARD: 'default', SIP: 'info', EXTRACURRICULAR: 'secondary' };
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import api from '../../api/axiosInstance';
import useAuth from '../../hooks/useAuth';

// Formats a time string by extracting only the HH:mm portion
const fmtTime = t => (t ? t.slice(0, 5) : '');

function TermTable({ entries, canEdit, onDelete, t }) {
  const sorted = [...entries].sort((a, b) =>
    a.dayOfWeek !== b.dayOfWeek
      ? a.dayOfWeek - b.dayOfWeek
      : fmtTime(a.startTime).localeCompare(fmtTime(b.startTime))
  );

  return (
    <TableContainer component={Paper} sx={{ mb: 1 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t('schedule.dayOfWeek')}</TableCell>
            <TableCell>{t('schedule.startTime')}</TableCell>
            <TableCell>{t('schedule.endTime')}</TableCell>
            <TableCell>{t('schedule.subject')}</TableCell>
            <TableCell>{t('schedule.teacher')}</TableCell>
            <TableCell>{t('schedule.lectureType')}</TableCell>
            {canEdit && <TableCell sx={{ width: 48 }} />}
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canEdit ? 7 : 6} align="center">
                {t('schedule.noEntries')}
              </TableCell>
            </TableRow>
          ) : (
            sorted.map(e => (
              <TableRow key={e.id} hover>
                <TableCell>{t(`schedule.days.${e.dayOfWeek}`)}</TableCell>
                <TableCell>{fmtTime(e.startTime)}</TableCell>
                <TableCell>{fmtTime(e.endTime)}</TableCell>
                <TableCell>{e.subjectName}</TableCell>
                <TableCell>{e.teacherName}</TableCell>
                <TableCell>
                  <Chip
                    label={t(`lectureTypes.${e.lectureType || 'STANDARD'}`)}
                    size="small"
                    color={TYPE_COLORS[e.lectureType] || 'default'}
                  />
                </TableCell>
                {canEdit && (
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => onDelete(e.id)}>
                      <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

const EMPTY_FORM = {
  subjectId: '', teacherId: '', term: '', dayOfWeek: '',
  startTime: '', endTime: '', lectureType: 'STANDARD', trackAttendance: true,
};

function Schedule() {
  const { t }       = useTranslation();
  const { classId } = useParams();
  const { user }    = useAuth();
  const canEdit     = user?.role === 'ADMIN' || user?.role === 'HEADMASTER';

  const [classInfo, setClassInfo] = useState(null);
  const [entries,   setEntries]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const [dialogOpen,      setDialogOpen]      = useState(false);
  const [subjects,        setSubjects]        = useState([]);
  const [teachers,        setTeachers]        = useState([]);
  const [schoolSlots,     setSchoolSlots]     = useState([]);   // LECTURE-type daily schedule entries
  const [teacherSchedule, setTeacherSchedule] = useState([]);   // selected teacher's existing schedule
  const [form,            setForm]            = useState(EMPTY_FORM);
  const [saving,          setSaving]          = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/api/classes/${classId}`),
      api.get(`/api/schedules/class/${classId}`),
    ])
      .then(([clsRes, schedRes]) => {
        setClassInfo(clsRes.data);
        setEntries(schedRes.data);
      })
      .catch(() => setError(t('schedule.fetchError')))
      .finally(() => setLoading(false));
  }, [classId]);

  const openAddDialog = () => {
    if (!classInfo) return;
    Promise.all([
      api.get('/api/subjects'),
      api.get(`/api/users/teachers/school/${classInfo.schoolId}`),
      api.get(`/api/schools/${classInfo.schoolId}/schedule`),
    ]).then(([subRes, teachRes, slotsRes]) => {
      setSubjects(subRes.data);
      setTeachers(teachRes.data);
      setSchoolSlots(slotsRes.data.filter(s => s.type === 'LECTURE')
        .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')));
      setTeacherSchedule([]);
      setForm(EMPTY_FORM);
      setDialogOpen(true);
    });
  };

  const handleTeacherChange = teacherId => {
    setForm(f => ({ ...f, teacherId, startTime: '', endTime: '' }));
    if (!teacherId) { setTeacherSchedule([]); return; }
    api.get(`/api/schedules/teacher/${teacherId}`)
      .then(res => setTeacherSchedule(res.data))
      .catch(() => setTeacherSchedule([]));
  };

  const handleAdd = () => {
    setSaving(true);
    api.post('/api/schedules', {
      classId:         Number(classId),
      subjectId:       Number(form.subjectId),
      teacherId:       Number(form.teacherId),
      term:            Number(form.term),
      dayOfWeek:       Number(form.dayOfWeek),
      startTime:       form.startTime,
      endTime:         form.endTime,
      lectureType:     form.lectureType,
      trackAttendance: form.lectureType === 'EXTRACURRICULAR' ? form.trackAttendance : true,
    })
      .then(res => {
        setEntries(prev => [...prev, res.data]);
        setDialogOpen(false);
      })
      .catch(() => setError(t('schedule.createError')))
      .finally(() => setSaving(false));
  };

  const handleDelete = id => {
    api.delete(`/api/schedules/${id}`)
      .then(() => setEntries(prev => prev.filter(e => e.id !== id)))
      .catch(() => setError(t('schedule.deleteError')));
  };

  const canSubmit = form.subjectId && form.teacherId && form.term &&
                    form.dayOfWeek && form.startTime && form.endTime && !saving;

  const term1 = entries.filter(e => e.term === 1);
  const term2 = entries.filter(e => e.term === 2);

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h5">
                  {t('schedule.title')} — {classInfo?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {classInfo?.schoolName} · {classInfo?.schoolYear}
                </Typography>
              </Box>
              {canEdit && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog}>
                  {t('schedule.addEntry')}
                </Button>
              )}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Typography variant="h6" sx={{ mb: 1 }}>{t('schedule.term1')}</Typography>
            <TermTable entries={term1} canEdit={canEdit} onDelete={handleDelete} t={t} />

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ mb: 1 }}>{t('schedule.term2')}</Typography>
            <TermTable entries={term2} canEdit={canEdit} onDelete={handleDelete} t={t} />
          </>
        )}
      </Box>

      {/* Add Entry Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('schedule.addEntry')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth size="small" required>
            <InputLabel>{t('schedule.subject')}</InputLabel>
            <Select
              value={form.subjectId}
              label={t('schedule.subject')}
              onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}
            >
              {subjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" required>
            <InputLabel>{t('schedule.teacher')}</InputLabel>
            <Select
              value={form.teacherId}
              label={t('schedule.teacher')}
              onChange={e => handleTeacherChange(e.target.value)}
            >
              {teachers.map(tc => <MenuItem key={tc.id} value={tc.id}>{tc.name}</MenuItem>)}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth size="small" required>
              <InputLabel>{t('schedule.term')}</InputLabel>
              <Select
                value={form.term}
                label={t('schedule.term')}
                onChange={e => setForm(f => ({ ...f, term: e.target.value, startTime: '', endTime: '' }))}
              >
                <MenuItem value={1}>{t('schedule.term1')}</MenuItem>
                <MenuItem value={2}>{t('schedule.term2')}</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" required>
              <InputLabel>{t('schedule.dayOfWeek')}</InputLabel>
              <Select
                value={form.dayOfWeek}
                label={t('schedule.dayOfWeek')}
                onChange={e => setForm(f => ({ ...f, dayOfWeek: e.target.value, startTime: '', endTime: '' }))}
              >
                {[1, 2, 3, 4, 5].map(d => (
                  <MenuItem key={d} value={d}>{t(`schedule.days.${d}`)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Time slot picker — requires term + day to be selected */}
          {form.term && form.dayOfWeek && (
            schoolSlots.length === 0 ? (
              <Alert severity="warning" sx={{ py: 0.5 }}>{t('schedule.noSlotsConfigured')}</Alert>
            ) : (
              <FormControl fullWidth size="small" required>
                <InputLabel>{t('schedule.selectSlot')}</InputLabel>
                <Select
                  value={form.startTime}
                  label={t('schedule.selectSlot')}
                  onChange={e => {
                    const slot = schoolSlots.find(s => s.startTime === e.target.value);
                    setForm(f => ({ ...f, startTime: slot.startTime, endTime: slot.endTime }));
                  }}
                >
                  {schoolSlots.map(slot => {
                    const classConflict = entries.some(e =>
                      e.term === form.term &&
                      e.dayOfWeek === form.dayOfWeek &&
                      fmtTime(e.startTime) === slot.startTime
                    );
                    const teacherConflict = teacherSchedule.some(e =>
                      e.term === form.term &&
                      e.dayOfWeek === form.dayOfWeek &&
                      fmtTime(e.startTime) === slot.startTime
                    );
                    const hint = classConflict
                      ? ` · ${t('schedule.slotClassBusy')}`
                      : teacherConflict
                        ? ` · ${t('schedule.slotTeacherBusy')}`
                        : '';
                    return (
                      <MenuItem
                        key={slot.id}
                        value={slot.startTime}
                        disabled={classConflict || teacherConflict}
                      >
                        {slot.startTime}–{slot.endTime}
                        {slot.label ? ` · ${slot.label}` : ''}
                        {hint}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            )
          )}

          <FormControl fullWidth size="small">
            <InputLabel>{t('schedule.lectureType')}</InputLabel>
            <Select
              value={form.lectureType}
              label={t('schedule.lectureType')}
              onChange={e => setForm(f => ({ ...f, lectureType: e.target.value }))}
            >
              {['STANDARD', 'SIP', 'EXTRACURRICULAR'].map(lt => (
                <MenuItem key={lt} value={lt}>{t(`lectureTypes.${lt}`)}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {form.lectureType === 'EXTRACURRICULAR' && (
            <FormControlLabel
              control={
                <Switch
                  checked={form.trackAttendance}
                  onChange={e => setForm(f => ({ ...f, trackAttendance: e.target.checked }))}
                />
              }
              label={t('schedule.trackAttendance')}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleAdd} disabled={!canSubmit}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}

export default Schedule;
