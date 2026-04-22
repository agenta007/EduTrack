import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogContent,
  DialogTitle, FormControl, FormControlLabel, IconButton, InputLabel,
  MenuItem, Paper, Select, Stack, Switch, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, ToggleButton,
  ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import AddIcon    from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon   from '@mui/icons-material/Edit';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';

// ── Lecture type display config ───────────────────────────────────────────────

const TYPE_COLORS = {
  STANDARD:       'default',
  SIP:            'info',
  EXTRACURRICULAR:'secondary',
};

// Formats a time string by extracting only the HH:mm portion
const fmtTime = t => (t ? t.slice(0, 5) : '');

const EMPTY_FORM = {
  subjectId: '', teacherId: '', term: 1, dayOfWeek: '',
  startTime: '', endTime: '', lectureType: 'STANDARD', trackAttendance: true,
};

// ── Entry card inside a grid cell ─────────────────────────────────────────────

function EntryCard({ entry, canEdit, onEdit, onDelete, t }) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 0.75, mb: 0.5, '&:last-child': { mb: 0 } }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 0.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" fontWeight={600} display="block" noWrap>
            {entry.subjectName}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" noWrap>
            {entry.teacherName}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {fmtTime(entry.startTime)}–{fmtTime(entry.endTime)}
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.25} mt={0.25}>
            <Chip
              label={t(`lectureTypes.${entry.lectureType}`)}
              size="small"
              color={TYPE_COLORS[entry.lectureType]}
              sx={{ height: 18, fontSize: 10 }}
            />
            {entry.lectureType === 'EXTRACURRICULAR' && !entry.trackAttendance && (
              <Chip
                label={t('schedule.optional')}
                size="small"
                variant="outlined"
                sx={{ height: 18, fontSize: 10 }}
              />
            )}
          </Stack>
        </Box>
        {canEdit && (
          <Box sx={{ display: 'flex', flexShrink: 0 }}>
            <Tooltip title={t('schedule.editType')}>
              <IconButton size="small" onClick={() => onEdit(entry)} sx={{ p: 0.25 }}>
                <EditIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={() => onDelete(entry.id)} sx={{ p: 0.25 }}>
              <DeleteIcon sx={{ fontSize: 14, color: 'error.main' }} />
            </IconButton>
          </Box>
        )}
      </Box>
    </Paper>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ClassTimetable({ schoolId, canEdit }) {
  const { t } = useTranslation();

  const [classes,   setClasses]   = useState([]);
  const [classId,   setClassId]   = useState('');
  const [entries,   setEntries]   = useState([]);
  const [subjects,  setSubjects]  = useState([]);
  const [teachers,  setTeachers]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [term,      setTerm]      = useState(1);

  // ── Add dialog ──────────────────────────────────────────────────────────────
  const [addOpen,   setAddOpen]   = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [addError,  setAddError]  = useState(null);
  const [saving,    setSaving]    = useState(false);

  // ── Edit type dialog ────────────────────────────────────────────────────────
  const [editEntry,   setEditEntry]   = useState(null);
  const [editType,    setEditType]    = useState('STANDARD');
  const [editTrack,   setEditTrack]   = useState(true);
  const [editError,   setEditError]   = useState(null);
  const [editSaving,  setEditSaving]  = useState(false);

  // Load classes
  useEffect(() => {
    if (!schoolId) return;
    api.get(`/api/classes/school/${schoolId}`)
      .then(res => setClasses(res.data))
      .catch(() => {});
  }, [schoolId]);

  // Load schedule + resources when class changes
  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    setError(null);
    Promise.all([
      api.get(`/api/schedules/class/${classId}`),
      api.get('/api/subjects'),
      api.get(`/api/users/teachers/school/${schoolId}`),
    ])
      .then(([schedRes, subRes, teachRes]) => {
        setEntries(schedRes.data);
        setSubjects(subRes.data);
        setTeachers(teachRes.data);
      })
      .catch(() => setError(t('schedule.fetchError')))
      .finally(() => setLoading(false));
  }, [classId]);

  // ── Build weekly grid ───────────────────────────────────────────────────────

  const termEntries = entries.filter(e => e.term === term);

  const times = [...new Set(termEntries.map(e => fmtTime(e.startTime)))]
    .filter(Boolean)
    .sort();

  const grid = {};
  termEntries.forEach(e => {
    const time = fmtTime(e.startTime);
    if (!grid[time]) grid[time] = {};
    if (!grid[time][e.dayOfWeek]) grid[time][e.dayOfWeek] = [];
    grid[time][e.dayOfWeek].push(e);
  });

  // ── Add ─────────────────────────────────────────────────────────────────────

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, term });
    setAddError(null);
    setAddOpen(true);
  };

  const handleAdd = () => {
    setSaving(true);
    setAddError(null);
    api.post('/api/schedules', {
      classId:        Number(classId),
      subjectId:      Number(form.subjectId),
      teacherId:      Number(form.teacherId),
      term:           Number(form.term),
      dayOfWeek:      Number(form.dayOfWeek),
      startTime:      form.startTime,
      endTime:        form.endTime,
      lectureType:    form.lectureType,
      trackAttendance: form.lectureType === 'EXTRACURRICULAR' ? form.trackAttendance : true,
    })
      .then(res => {
        setEntries(prev => [...prev, res.data]);
        setAddOpen(false);
      })
      .catch(() => setAddError(t('schedule.createError')))
      .finally(() => setSaving(false));
  };

  // ── Delete ───────────────────────────────────────────────────────────────────

  const handleDelete = id => {
    api.delete(`/api/schedules/${id}`)
      .then(() => setEntries(prev => prev.filter(e => e.id !== id)))
      .catch(() => setError(t('schedule.deleteError')));
  };

  // ── Edit type ────────────────────────────────────────────────────────────────

  const openEditType = entry => {
    setEditEntry(entry);
    setEditType(entry.lectureType);
    setEditTrack(entry.trackAttendance);
    setEditError(null);
  };

  const handleEditSave = () => {
    setEditSaving(true);
    setEditError(null);
    const trackAttendance = editType === 'EXTRACURRICULAR' ? editTrack : true;
    api.patch(`/api/schedules/${editEntry.id}/type`, { lectureType: editType, trackAttendance })
      .then(res => {
        setEntries(prev => prev.map(e => e.id === res.data.id ? res.data : e));
        setEditEntry(null);
      })
      .catch(() => setEditError(t('schedule.createError')))
      .finally(() => setEditSaving(false));
  };

  const canSubmit = form.subjectId && form.teacherId && form.dayOfWeek && form.startTime && form.endTime;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Box>
      {/* Header row */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>{t('schedule.selectClass')}</InputLabel>
          <Select
            value={classId}
            label={t('schedule.selectClass')}
            onChange={e => setClassId(e.target.value)}
          >
            {classes.map(c => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <ToggleButtonGroup
          value={term}
          exclusive
          size="small"
          onChange={(_, v) => v && setTerm(v)}
        >
          <ToggleButton value={1}>{t('schedule.term1')}</ToggleButton>
          <ToggleButton value={2}>{t('schedule.term2')}</ToggleButton>
        </ToggleButtonGroup>

        {classId && canEdit && (
          <Button size="small" startIcon={<AddIcon />} onClick={openAdd}>
            {t('schedule.addEntry')}
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!classId ? (
        <Typography variant="body2" color="text.secondary">
          {t('schedule.selectClassPrompt')}
        </Typography>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small" sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 60, fontWeight: 600 }}>{t('schedule.startTime')}</TableCell>
                {[1, 2, 3, 4, 5].map(d => (
                  <TableCell key={d} sx={{ fontWeight: 600 }}>{t(`schedule.days.${d}`)}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {times.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">{t('schedule.noEntries')}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                times.map(time => (
                  <TableRow key={time}>
                    <TableCell sx={{ verticalAlign: 'top', fontWeight: 500, pt: 1 }}>{time}</TableCell>
                    {[1, 2, 3, 4, 5].map(day => (
                      <TableCell key={day} sx={{ verticalAlign: 'top', p: 0.5 }}>
                        {(grid[time]?.[day] ?? []).map(e => (
                          <EntryCard
                            key={e.id}
                            entry={e}
                            canEdit={canEdit}
                            onEdit={openEditType}
                            onDelete={handleDelete}
                            t={t}
                          />
                        ))}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── Add entry dialog ─────────────────────────────────────────────────── */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('schedule.addEntry')}</DialogTitle>
        <DialogContent>
          {addError && <Alert severity="error" sx={{ mb: 1 }}>{addError}</Alert>}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small" required>
              <InputLabel>{t('schedule.subject')}</InputLabel>
              <Select value={form.subjectId} label={t('schedule.subject')}
                onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}>
                {subjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" required>
              <InputLabel>{t('schedule.teacher')}</InputLabel>
              <Select value={form.teacherId} label={t('schedule.teacher')}
                onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}>
                {teachers.map(tc => <MenuItem key={tc.id} value={tc.id}>{tc.name}</MenuItem>)}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth size="small" required>
                <InputLabel>{t('schedule.term')}</InputLabel>
                <Select value={form.term} label={t('schedule.term')}
                  onChange={e => setForm(f => ({ ...f, term: e.target.value }))}>
                  <MenuItem value={1}>{t('schedule.term1')}</MenuItem>
                  <MenuItem value={2}>{t('schedule.term2')}</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" required>
                <InputLabel>{t('schedule.dayOfWeek')}</InputLabel>
                <Select value={form.dayOfWeek} label={t('schedule.dayOfWeek')}
                  onChange={e => setForm(f => ({ ...f, dayOfWeek: e.target.value }))}>
                  {[1, 2, 3, 4, 5].map(d => (
                    <MenuItem key={d} value={d}>{t(`schedule.days.${d}`)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField fullWidth size="small" required type="time"
                label={t('schedule.startTime')} value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                InputLabelProps={{ shrink: true }} />
              <TextField fullWidth size="small" required type="time"
                label={t('schedule.endTime')} value={form.endTime}
                onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                InputLabelProps={{ shrink: true }} />
            </Box>

            <FormControl fullWidth size="small">
              <InputLabel>{t('schedule.lectureType')}</InputLabel>
              <Select value={form.lectureType} label={t('schedule.lectureType')}
                onChange={e => setForm(f => ({
                  ...f,
                  lectureType: e.target.value,
                  trackAttendance: e.target.value === 'EXTRACURRICULAR' ? f.trackAttendance : true,
                }))}>
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
                    size="small"
                  />
                }
                label={t('schedule.trackAttendance')}
              />
            )}

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button size="small" onClick={() => setAddOpen(false)}>{t('common.cancel')}</Button>
              <Button size="small" variant="contained" onClick={handleAdd}
                disabled={!canSubmit || saving}>
                {t('common.save')}
              </Button>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* ── Edit type dialog ──────────────────────────────────────────────────── */}
      <Dialog open={!!editEntry} onClose={() => setEditEntry(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('schedule.editType')}</DialogTitle>
        <DialogContent>
          {editError && <Alert severity="error" sx={{ mb: 1 }}>{editError}</Alert>}
          <Stack spacing={2} sx={{ mt: 1 }}>
            {editEntry && (
              <Typography variant="body2" color="text.secondary">
                {editEntry.subjectName} · {t(`schedule.days.${editEntry.dayOfWeek}`)} {fmtTime(editEntry.startTime)}
              </Typography>
            )}
            <FormControl fullWidth size="small">
              <InputLabel>{t('schedule.lectureType')}</InputLabel>
              <Select value={editType} label={t('schedule.lectureType')}
                onChange={e => {
                  setEditType(e.target.value);
                  if (e.target.value !== 'EXTRACURRICULAR') setEditTrack(true);
                }}>
                {['STANDARD', 'SIP', 'EXTRACURRICULAR'].map(lt => (
                  <MenuItem key={lt} value={lt}>{t(`lectureTypes.${lt}`)}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {editType === 'EXTRACURRICULAR' && (
              <FormControlLabel
                control={
                  <Switch
                    checked={editTrack}
                    onChange={e => setEditTrack(e.target.checked)}
                    size="small"
                  />
                }
                label={t('schedule.trackAttendance')}
              />
            )}

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button size="small" onClick={() => setEditEntry(null)}>{t('common.cancel')}</Button>
              <Button size="small" variant="contained" onClick={handleEditSave} disabled={editSaving}>
                {t('common.save')}
              </Button>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
