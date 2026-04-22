import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, IconButton, InputLabel,
  MenuItem, Paper, Select, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tabs, TextField, Typography,
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

const GRADE_COLOR = v => {
  // Map a numeric grade to a Material UI severity color string
  const n = parseFloat(v);
  // Return 'success' (green) for excellent grades (5.5 - 6.0)
  if (n >= 5.5) return 'success';
  // Return 'primary' (blue) for good grades (4.5 - 5.0)
  if (n >= 4.5) return 'primary';
  // Return 'warning' (orange) for passing grades (3.5 - 4.0)
  if (n >= 3.5) return 'warning';
  // Return 'error' (red) for failing grades (2.0 - 3.0)
  return 'error';
};

function ClassGrades() {
  const { classId } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const canEdit = ['ADMIN', 'HEADMASTER', 'TEACHER'].includes(user?.role);

  const [classInfo, setClassInfo] = useState(null);
  const [grades, setGrades]       = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [students, setStudents]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [termTab, setTermTab]     = useState(0); // 0=All, 1=Term1, 2=Term2

  const [addOpen, setAddOpen]     = useState(false);
  const [addForm, setAddForm]     = useState({ studentId: '', subjectId: '', term: '', value: '' });
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/api/classes/${classId}`),
      api.get(`/api/grades/class/${classId}`),
      api.get(`/api/schedules/class/${classId}`),
      api.get(`/api/classes/${classId}/students`),
    ])
      .then(([ci, gr, sc, st]) => {
        setClassInfo(ci.data);
        setGrades(gr.data);
        setSchedules(sc.data);
        setStudents(st.data);
      })
      .catch(() => setError(t('grades.fetchError')))
      .finally(() => setLoading(false));
  }, [classId]);

  const termFilter = termTab === 0 ? null : termTab;

  // Schedules visible under the active term filter
  const visibleSchedules = useMemo(
    () => termFilter ? schedules.filter(s => s.term === termFilter) : schedules,
    [schedules, termFilter]
  );

  // One column per unique subject in the visible schedules
  const subjectColumns = useMemo(() => {
    const seen = new Set();
    return visibleSchedules.filter(s => {
      if (seen.has(s.subjectId)) return false;
      seen.add(s.subjectId);
      return true;
    });
  }, [visibleSchedules]);

  // Grades filtered by active term
  const filteredGrades = useMemo(
    () => termFilter ? grades.filter(g => g.term === termFilter) : grades,
    [grades, termFilter]
  );

  // gradeMap[studentId][subjectId] = GradeDto[]
  const gradeMap = useMemo(() => {
    const m = {};
    filteredGrades.forEach(g => {
      if (!m[g.studentId]) m[g.studentId] = {};
      if (!m[g.studentId][g.subjectId]) m[g.studentId][g.subjectId] = [];
      m[g.studentId][g.subjectId].push(g);
    });
    return m;
  }, [filteredGrades]);

  // weeklyHoursMap[subjectId][term] = number of schedule slots = minimum required grades
  const weeklyHoursMap = useMemo(() => {
    const m = {};
    schedules.forEach(s => {
      if (!m[s.subjectId]) m[s.subjectId] = {};
      m[s.subjectId][s.term] = (m[s.subjectId][s.term] ?? 0) + 1;
    });
    return m;
  }, [schedules]);

  // For teachers, only expose subjects they personally teach in this class.
  const teacherSchedules = useMemo(() => {
    if (user?.role !== 'TEACHER') return schedules;
    return schedules.filter(s => s.teacherId === user.id);
  }, [schedules, user]);

  // Unique subjects available for this class (for the dialog dropdown)
  const uniqueSubjects = useMemo(() => {
    const seen = new Set();
    return teacherSchedules.filter(s => {
      if (seen.has(s.subjectId)) return false;
      seen.add(s.subjectId);
      return true;
    });
  }, [teacherSchedules]);

  // Resolve the schedule entry that matches the selected subject + term
  const resolvedScheduleId = useMemo(() => {
    if (!addForm.subjectId || !addForm.term) return null;
    const match = teacherSchedules.find(
      s => s.subjectId === Number(addForm.subjectId) && s.term === Number(addForm.term)
    );
    return match ? match.id : null;
  }, [teacherSchedules, addForm.subjectId, addForm.term]);

  const termByMonth = () => {
    const m = new Date().getMonth() + 1; // 1–12
    if (m >= 9 || m <= 2) return '1';   // Sep–Feb → term 1
    if (m >= 3 && m <= 6) return '2';   // Mar–Jun → term 2
    return '';                           // Jul–Aug → summer, leave blank
  };

  const openAdd = (studentId = '') => {
    setAddForm({
      studentId: String(studentId),
      subjectId: '',
      term: termTab !== 0 ? String(termTab) : termByMonth(),
      value: '',
    });
    setAddOpen(true);
  };

  const handleAdd = () => {
    if (!resolvedScheduleId) return;
    setSaving(true);
    api.post('/api/grades', {
      studentId:  Number(addForm.studentId),
      scheduleId: resolvedScheduleId,
      value:      parseFloat(addForm.value),
    })
      .then(res => {
        setGrades(prev => [...prev, res.data]);
        setAddOpen(false);
        setAddForm({ studentId: '', subjectId: '', term: '', value: '' });
      })
      .catch(() => setError(t('grades.createError')))
      .finally(() => setSaving(false));
  };

  const handleDelete = id => {
    api.delete(`/api/grades/${id}`)
      .then(() => setGrades(prev => prev.filter(g => g.id !== id)))
      .catch(() => setError(t('grades.deleteError')));
  };

  const VALID_GRADES = ['2', '2.5', '3', '3.5', '4', '4.5', '5', '5.5', '6'];

  const isAddValid =
    addForm.studentId &&
    resolvedScheduleId &&
    VALID_GRADES.includes(addForm.value);

  const colSpan = subjectColumns.length + (canEdit ? 3 : 2);

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
        ) : (
          <>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography variant="h5">{t('grades.title')} — {classInfo?.name}</Typography>
                <Typography variant="body2" color="text.secondary">{classInfo?.schoolName}</Typography>
              </Box>
              {canEdit && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => openAdd()}>
                  {t('grades.addGrade')}
                </Button>
              )}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Tabs value={termTab} onChange={(_, v) => setTermTab(v)} sx={{ mb: 2 }}>
              <Tab label={t('grades.all')} />
              <Tab label={t('schedule.term1')} />
              <Tab label={t('schedule.term2')} />
            </Tabs>

            {/* Journal table: rows = students, columns = subjects */}
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, minWidth: 150 }}>{t('grades.student')}</TableCell>
                    {subjectColumns.map(s => (
                      <TableCell key={s.subjectId} sx={{ fontWeight: 700 }}>
                        {s.subjectName}
                        {termFilter && (weeklyHoursMap[s.subjectId]?.[termFilter] ?? 0) > 0 && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 400 }}>
                            min {weeklyHoursMap[s.subjectId][termFilter]}
                          </Typography>
                        )}
                      </TableCell>
                    ))}
                    <TableCell sx={{ fontWeight: 700, minWidth: 90 }}>{t('grades.average')}</TableCell>
                    {canEdit && <TableCell sx={{ width: 48 }} />}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={colSpan} align="center">{t('grades.noGrades')}</TableCell>
                    </TableRow>
                  ) : (
                    students.map(student => {
                      const sg = filteredGrades.filter(g => g.studentId === student.id);
                      const avg = sg.length
                        ? (sg.reduce((acc, g) => acc + parseFloat(g.value), 0) / sg.length).toFixed(2)
                        : null;

                      return (
                        <TableRow key={student.id} hover>
                          <TableCell sx={{ fontWeight: 500 }}>{student.name}</TableCell>

                          {subjectColumns.map(subj => {
                            const cellGrades = gradeMap[student.id]?.[subj.subjectId] ?? [];
                            return (
                              <TableCell key={subj.subjectId}>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {cellGrades.map(g => (
                                    <Chip
                                      key={g.id}
                                      label={g.value}
                                      size="small"
                                      color={GRADE_COLOR(g.value)}
                                      onDelete={canEdit ? () => handleDelete(g.id) : undefined}
                                      deleteIcon={<DeleteIcon />}
                                    />
                                  ))}
                                </Box>
                                {termFilter && (() => {
                                  const required = weeklyHoursMap[subj.subjectId]?.[termFilter] ?? 0;
                                  if (required === 0) return null;
                                  const actual = cellGrades.length;
                                  return (
                                    <Typography
                                      variant="caption"
                                      sx={{ fontWeight: 600, color: actual >= required ? 'success.main' : 'warning.main' }}
                                    >
                                      {actual}/{required}
                                    </Typography>
                                  );
                                })()}
                              </TableCell>
                            );
                          })}

                          <TableCell>
                            {avg && (
                              <Chip
                                label={avg}
                                size="small"
                                color={GRADE_COLOR(avg)}
                                variant="outlined"
                              />
                            )}
                          </TableCell>

                          {canEdit && (
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                color="primary"
                                title={t('grades.addGrade')}
                                onClick={() => openAdd(student.id)}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Box>

      {/* Add-grade dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('grades.addGrade')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>

          <FormControl fullWidth>
            <InputLabel sx={{ color: 'black', '&.Mui-focused': { color: 'black' } }}>
              {t('grades.student')}
            </InputLabel>
            <Select
              value={addForm.studentId}
              onChange={e => setAddForm(f => ({ ...f, studentId: e.target.value }))}
              label={t('grades.student')}
              sx={{ color: 'black' }}
            >
              {students.map(s => (
                <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel sx={{ color: 'black', '&.Mui-focused': { color: 'black' } }}>
              {t('grades.subject')}
            </InputLabel>
            <Select
              value={addForm.subjectId}
              onChange={e => setAddForm(f => ({ ...f, subjectId: e.target.value }))}
              label={t('grades.subject')}
              sx={{ color: 'black' }}
            >
              {uniqueSubjects.map(s => (
                <MenuItem key={s.subjectId} value={String(s.subjectId)}>
                  {s.subjectName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel sx={{ color: 'black', '&.Mui-focused': { color: 'black' } }}>
              {t('schedule.term')}
            </InputLabel>
            <Select
              value={addForm.term}
              onChange={e => setAddForm(f => ({ ...f, term: e.target.value }))}
              label={t('schedule.term')}
              sx={{ color: 'black' }}
            >
              <MenuItem value="1">{t('schedule.term1')}</MenuItem>
              <MenuItem value="2">{t('schedule.term2')}</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel sx={{ color: 'black', '&.Mui-focused': { color: 'black' } }}>
              {t('grades.gradeValue')}
            </InputLabel>
            <Select
              value={addForm.value}
              onChange={e => setAddForm(f => ({ ...f, value: e.target.value }))}
              label={t('grades.gradeValue')}
              sx={{ color: 'black' }}
            >
              {[
                { v: '6',   label: t('grades.excellent') },
                { v: '5.5', label: null },
                { v: '5',   label: t('grades.veryGood') },
                { v: '4.5', label: null },
                { v: '4',   label: t('grades.good') },
                { v: '3.5', label: null },
                { v: '3',   label: t('grades.average') },
                { v: '2.5', label: null },
                { v: '2',   label: t('grades.poor') },
              ].map(({ v, label }) => (
                <MenuItem key={v} value={v}>
                  {v}{label ? ` — ${label}` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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

export default ClassGrades;
