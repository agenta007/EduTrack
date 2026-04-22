import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogContent,
  DialogTitle, FormGroup, FormControlLabel, Checkbox, IconButton,
  InputAdornment, Paper, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Tooltip, Typography,
} from '@mui/material';
import BlockIcon      from '@mui/icons-material/Block';
import EditIcon       from '@mui/icons-material/Edit';
import PersonAddIcon  from '@mui/icons-material/PersonAdd';
import SchoolIcon     from '@mui/icons-material/School';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import UserAvatar from '../../components/UserAvatar';
import api from '../../api/axiosInstance';

function ViewTeachers() {
  const { t } = useTranslation();

  const [teachers,    setTeachers]    = useState([]);
  const [schoolId,    setSchoolId]    = useState(null);
  const [schoolName,  setSchoolName]  = useState('');
  const [subjects,    setSubjects]    = useState([]); // all subjects for qualif. dialog
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  // ── Hire dialog ────────────────────────────────────────────────────────────
  const [hireOpen,    setHireOpen]    = useState(false);
  const [hireFirst,   setHireFirst]   = useState('');
  const [hireLast,    setHireLast]    = useState('');
  const [hireEmail,   setHireEmail]   = useState('');
  const [hirePass,    setHirePass]    = useState('');
  const [hireError,   setHireError]   = useState(null);
  const [hireSaving,  setHireSaving]  = useState(false);

  // ── Fire dialog ────────────────────────────────────────────────────────────
  const [fireTarget, setFireTarget] = useState(null); // { id, name }
  const [fireError,  setFireError]  = useState(null);

  // ── Salary dialog ──────────────────────────────────────────────────────────
  const [salaryTarget, setSalaryTarget] = useState(null); // { id, name, salary }
  const [salaryInput,  setSalaryInput]  = useState('');
  const [salaryError,  setSalaryError]  = useState(null);
  const [salarySaving, setSalarySaving] = useState(false);

  // ── Qualifications dialog ──────────────────────────────────────────────────
  const [qualTarget,  setQualTarget]  = useState(null); // teacher object
  const [qualChecked, setQualChecked] = useState(new Set());
  const [qualError,   setQualError]   = useState(null);
  const [qualSaving,  setQualSaving]  = useState(false);

  // ── Load ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    api.get('/api/profile')
      .then(res => {
        const sid = res.data.schoolId;
        setSchoolId(sid);
        setSchoolName(res.data.schoolName || '');
        return Promise.all([
          api.get(`/api/teachers/school/${sid}`),
          api.get('/api/subjects'),
        ]);
      })
      .then(([teacherRes, subjectRes]) => {
        setTeachers(teacherRes.data);
        setSubjects(subjectRes.data);
      })
      .catch(() => setError(t('users.fetchError')))
      .finally(() => setLoading(false));
  }, []);

  // ── Hire ───────────────────────────────────────────────────────────────────

  const openHire = () => {
    setHireFirst(''); setHireLast(''); setHireEmail(''); setHirePass('');
    setHireError(null);
    setHireOpen(true);
  };

  const handleHire = () => {
    setHireSaving(true);
    setHireError(null);
    api.post('/api/teachers/create-and-hire', {
      firstName: hireFirst, lastName: hireLast, email: hireEmail, password: hirePass,
    })
      .then(res => {
        setTeachers(prev => [...prev, res.data]);
        setHireOpen(false);
      })
      .catch(() => setHireError(t('teachers.hireError')))
      .finally(() => setHireSaving(false));
  };

  // ── Fire ───────────────────────────────────────────────────────────────────

  const handleFire = () => {
    if (!fireTarget) return;
    setFireError(null);
    api.delete(`/api/teachers/${fireTarget.id}/fire`)
      .then(() => {
        setTeachers(prev => prev.filter(t => t.id !== fireTarget.id));
        setFireTarget(null);
      })
      .catch(() => setFireError(t('teachers.fireError')));
  };

  // ── Salary ─────────────────────────────────────────────────────────────────

  const openSalary = (teacher) => {
    setSalaryTarget(teacher);
    setSalaryInput(teacher.salary != null ? String(teacher.salary) : '');
    setSalaryError(null);
  };

  const handleSalarySave = () => {
    setSalarySaving(true);
    setSalaryError(null);
    const payload = { salary: salaryInput === '' ? null : parseFloat(salaryInput) };
    api.put(`/api/teachers/${salaryTarget.id}/salary`, payload)
      .then(res => {
        setTeachers(prev => prev.map(t => t.id === salaryTarget.id ? res.data : t));
        setSalaryTarget(null);
      })
      .catch(() => setSalaryError(t('teachers.salaryError')))
      .finally(() => setSalarySaving(false));
  };

  // ── Qualifications ─────────────────────────────────────────────────────────

  const openQual = (teacher) => {
    setQualTarget(teacher);
    setQualChecked(new Set(teacher.qualifications.map(q => q.id)));
    setQualError(null);
  };

  const toggleQual = (id) => {
    setQualChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleQualSave = () => {
    setQualSaving(true);
    setQualError(null);
    api.put(`/api/teachers/${qualTarget.id}/qualifications`, { subjectIds: [...qualChecked] })
      .then(res => {
        setTeachers(prev => prev.map(t => t.id === qualTarget.id ? res.data : t));
        setQualTarget(null);
      })
      .catch(() => setQualError(t('teachers.qualError')))
      .finally(() => setQualSaving(false));
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box>
            <Typography variant="h5">{t('nav.teachers')}</Typography>
            {schoolName && (
              <Typography variant="body2" color="text.secondary">{schoolName}</Typography>
            )}
          </Box>
          <Button size="small" startIcon={<PersonAddIcon />} onClick={openHire}>
            {t('teachers.hire')}
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 48 }} />
                  <TableCell>{t('users.firstName')} {t('users.lastName')}</TableCell>
                  <TableCell>{t('teachers.qualifications')}</TableCell>
                  <TableCell align="center">
                    <Tooltip title={t('teachers.classesTooltip')}>
                      <span><SchoolIcon fontSize="small" sx={{ verticalAlign: 'middle' }} /></span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{t('teachers.salary')}</TableCell>
                  <TableCell sx={{ width: 100 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {teachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">{t('users.noUsers')}</TableCell>
                  </TableRow>
                ) : (
                  teachers.map(teacher => (
                    <TableRow key={teacher.id} hover>
                      <TableCell>
                        <UserAvatar userId={teacher.id} name={teacher.name} size={36} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{teacher.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{teacher.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" flexWrap="wrap" gap={0.5}>
                          {teacher.qualifications.length === 0 ? (
                            <Typography variant="caption" color="text.disabled">—</Typography>
                          ) : (
                            teacher.qualifications.map(q => (
                              <Chip key={q.id} label={q.name} size="small" />
                            ))
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{teacher.classCount}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {teacher.salary != null ? `${teacher.salary} евро.` : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={t('teachers.editSalary')}>
                          <IconButton size="small" onClick={() => openSalary(teacher)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('teachers.editQualifications')}>
                          <IconButton size="small" onClick={() => openQual(teacher)}>
                            <SchoolIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('teachers.fire')}>
                          <IconButton size="small" onClick={() => { setFireTarget({ id: teacher.id, name: teacher.name }); setFireError(null); }}>
                            <BlockIcon fontSize="small" sx={{ color: 'error.main' }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* ── Hire dialog ──────────────────────────────────────────────────── */}
        <Dialog open={hireOpen} onClose={() => setHireOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>{t('teachers.hireTitle')}</DialogTitle>
          <DialogContent>
            {hireError && <Alert severity="error" sx={{ mb: 1 }}>{hireError}</Alert>}
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  autoFocus size="small" fullWidth
                  label={t('users.firstName')}
                  value={hireFirst}
                  onChange={e => setHireFirst(e.target.value)}
                />
                <TextField
                  size="small" fullWidth
                  label={t('users.lastName')}
                  value={hireLast}
                  onChange={e => setHireLast(e.target.value)}
                />
              </Box>
              <TextField
                size="small" fullWidth
                label={t('users.email')}
                type="email"
                value={hireEmail}
                onChange={e => setHireEmail(e.target.value)}
              />
              <TextField
                size="small" fullWidth
                label={t('users.password')}
                type="password"
                value={hirePass}
                onChange={e => setHirePass(e.target.value)}
              />
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button size="small" onClick={() => setHireOpen(false)}>{t('common.cancel')}</Button>
                <Button
                  size="small" variant="contained"
                  disabled={!hireFirst || !hireLast || !hireEmail || !hirePass || hireSaving}
                  onClick={handleHire}
                >
                  {t('teachers.hire')}
                </Button>
              </Box>
            </Stack>
          </DialogContent>
        </Dialog>

        {/* ── Fire confirmation ─────────────────────────────────────────────── */}
        <Dialog open={!!fireTarget} onClose={() => setFireTarget(null)} maxWidth="xs" fullWidth>
          <DialogTitle>{t('teachers.fireTitle')}</DialogTitle>
          <DialogContent>
            {fireError && <Alert severity="error" sx={{ mb: 1 }}>{fireError}</Alert>}
            <Typography sx={{ mb: 2 }}>
              {t('teachers.fireConfirm', { name: fireTarget?.name })}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button size="small" onClick={() => setFireTarget(null)}>{t('common.cancel')}</Button>
              <Button size="small" variant="contained" color="error" onClick={handleFire}>
                {t('teachers.fire')}
              </Button>
            </Box>
          </DialogContent>
        </Dialog>

        {/* ── Salary dialog ─────────────────────────────────────────────────── */}
        <Dialog open={!!salaryTarget} onClose={() => setSalaryTarget(null)} maxWidth="xs" fullWidth>
          <DialogTitle>{t('teachers.editSalary')} — {salaryTarget?.name}</DialogTitle>
          <DialogContent>
            {salaryError && <Alert severity="error" sx={{ mb: 1 }}>{salaryError}</Alert>}
            <TextField
              autoFocus
              size="small"
              fullWidth
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              label={t('teachers.salary')}
              placeholder={t('teachers.salaryPlaceholder')}
              value={salaryInput}
              onChange={e => setSalaryInput(e.target.value)}
              InputProps={{ endAdornment: <InputAdornment position="end">лв.</InputAdornment> }}
              sx={{ mt: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
              <Button size="small" onClick={() => setSalaryTarget(null)}>{t('common.cancel')}</Button>
              <Button size="small" variant="contained" onClick={handleSalarySave} disabled={salarySaving}>
                {t('common.save')}
              </Button>
            </Box>
          </DialogContent>
        </Dialog>

        {/* ── Qualifications dialog ─────────────────────────────────────────── */}
        <Dialog open={!!qualTarget} onClose={() => setQualTarget(null)} maxWidth="xs" fullWidth>
          <DialogTitle>{t('teachers.editQualifications')} — {qualTarget?.name}</DialogTitle>
          <DialogContent>
            {qualError && <Alert severity="error" sx={{ mb: 1 }}>{qualError}</Alert>}
            {subjects.length === 0 ? (
              <Typography variant="body2" color="text.secondary">{t('subjects.noSubjects')}</Typography>
            ) : (
              <FormGroup>
                {subjects.map(s => (
                  <FormControlLabel
                    key={s.id}
                    control={
                      <Checkbox
                        size="small"
                        checked={qualChecked.has(s.id)}
                        onChange={() => toggleQual(s.id)}
                      />
                    }
                    label={s.name}
                  />
                ))}
              </FormGroup>
            )}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
              <Button size="small" onClick={() => setQualTarget(null)}>{t('common.cancel')}</Button>
              <Button size="small" variant="contained" onClick={handleQualSave} disabled={qualSaving}>
                {t('common.save')}
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      </Box>
    </Layout>
  );
}

export default ViewTeachers;
