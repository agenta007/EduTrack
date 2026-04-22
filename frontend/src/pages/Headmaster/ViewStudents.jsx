import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, Paper, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BlockIcon from '@mui/icons-material/Block';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import UserAvatar from '../../components/UserAvatar';
import api from '../../api/axiosInstance';

function ViewStudents() {
  const { t } = useTranslation();
  const [students,   setStudents]   = useState([]);
  const [schoolName, setSchoolName] = useState('');
  const [parentMap,  setParentMap]  = useState({});
  const [capacity,   setCapacity]   = useState({ current: 0, limit: -1 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  // Enroll (existing user) dialog
  const [enrollOpen,   setEnrollOpen]   = useState(false);
  const [available,    setAvailable]    = useState([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [enrollError,  setEnrollError]  = useState(null);

  // Create & Enroll dialog
  const [createOpen,    setCreateOpen]    = useState(false);
  const [createFirst,   setCreateFirst]   = useState('');
  const [createLast,    setCreateLast]    = useState('');
  const [createEmail,   setCreateEmail]   = useState('');
  const [createPass,    setCreatePass]    = useState('');
  const [createError,   setCreateError]   = useState(null);
  const [createSaving,  setCreateSaving]  = useState(false);

  // Expel confirmation dialog
  const [expelTarget, setExpelTarget] = useState(null);
  const [expelError,  setExpelError]  = useState(null);

  useEffect(() => {
    api.get('/api/profile')
      .then(res => {
        const sid = res.data.schoolId;
        setSchoolName(res.data.schoolName || '');
        return Promise.all([
          api.get(`/api/users/students/school/${sid}`),
          api.get(`/api/parents/school/${sid}`),
          api.get('/api/students/capacity'),
        ]);
      })
      .then(([studentRes, parentRes, capacityRes]) => {
        setStudents(studentRes.data);
        const map = {};
        parentRes.data.forEach(p => {
          p.children.forEach(c => { map[c.id] = `${p.firstName} ${p.lastName}`; });
        });
        setParentMap(map);
        setCapacity(capacityRes.data);
      })
      .catch(() => setError(t('users.fetchError')))
      .finally(() => setLoading(false));
  }, [t]);

  const atLimit = capacity.limit !== -1 && capacity.current >= capacity.limit;

  // ── Enroll ────────────────────────────────────────────────────────────────

  const openEnroll = () => {
    setEnrollError(null);
    setEnrollOpen(true);
    setAvailLoading(true);
    api.get('/api/students/available')
      .then(res => setAvailable(res.data))
      .catch(() => setEnrollError(t('students.fetchAvailableError')))
      .finally(() => setAvailLoading(false));
  };

  const handleEnroll = (userId) => {
    api.post(`/api/students/${userId}/enroll`)
      .then(res => {
        setStudents(prev => [...prev, res.data]);
        setAvailable(prev => prev.filter(u => u.id !== userId));
        setCapacity(prev => ({ ...prev, current: prev.current + 1 }));
      })
      .catch(() => setEnrollError(t('students.enrollError')));
  };

  // ── Create & Enroll ────────────────────────────────────────────────────────

  const openCreate = () => {
    setCreateFirst(''); setCreateLast(''); setCreateEmail(''); setCreatePass('');
    setCreateError(null);
    setCreateOpen(true);
  };

  const handleCreateAndEnroll = () => {
    setCreateSaving(true);
    setCreateError(null);
    api.post('/api/students/create-and-enroll', {
      firstName: createFirst, lastName: createLast, email: createEmail, password: createPass,
    })
      .then(res => {
        setStudents(prev => [...prev, res.data]);
        setCapacity(prev => ({ ...prev, current: prev.current + 1 }));
        setCreateOpen(false);
      })
      .catch(() => setCreateError(t('students.createError')))
      .finally(() => setCreateSaving(false));
  };

  // ── Expel ─────────────────────────────────────────────────────────────────

  const handleExpelConfirm = () => {
    if (!expelTarget) return;
    api.delete(`/api/students/${expelTarget.id}/expel`)
      .then(() => {
        setStudents(prev => prev.filter(s => s.id !== expelTarget.id));
        setCapacity(prev => ({ ...prev, current: prev.current - 1 }));
        setExpelTarget(null);
      })
      .catch(() => setExpelError(t('students.expelError')));
  };

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box>
            <Typography variant="h5">{t('nav.students')}</Typography>
            {schoolName && (
              <Typography variant="body2" color="text.secondary">{schoolName}</Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              size="small"
              label={
                capacity.limit === -1
                  ? `${capacity.current} ${t('students.enrolled')}`
                  : `${capacity.current} / ${capacity.limit} ${t('students.enrolled')}`
              }
              color={atLimit ? 'error' : 'default'}
            />
            <Button
              variant="outlined"
              startIcon={<PersonAddIcon />}
              disabled={atLimit}
              onClick={openEnroll}
            >
              {t('students.enroll')}
            </Button>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              disabled={atLimit}
              onClick={openCreate}
            >
              {t('students.createAndEnroll')}
            </Button>
          </Box>
        </Box>

        {error      && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {expelError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setExpelError(null)}>{expelError}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 56 }} />
                  <TableCell>{t('users.firstName')} {t('users.lastName')}</TableCell>
                  <TableCell>{t('users.email')}</TableCell>
                  <TableCell>{t('nav.parents')}</TableCell>
                  <TableCell align="center">{t('schools.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">{t('users.noUsers')}</TableCell>
                  </TableRow>
                ) : (
                  students.map(s => (
                    <TableRow key={s.id} hover>
                      <TableCell>
                        <UserAvatar userId={s.id} name={`${s.firstName} ${s.lastName}`} size={36} />
                      </TableCell>
                      <TableCell>{s.firstName} {s.lastName}</TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color={parentMap[s.id] ? 'text.primary' : 'text.disabled'}>
                          {parentMap[s.id] ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          title={t('students.expel')}
                          onClick={() => setExpelTarget({ id: s.id, name: `${s.firstName} ${s.lastName}` })}
                        >
                          <BlockIcon fontSize="small" sx={{ color: 'error.main' }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Enroll Dialog */}
      <Dialog open={enrollOpen} onClose={() => setEnrollOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('students.enrollTitle')}</DialogTitle>
        <DialogContent>
          {enrollError && <Alert severity="error" sx={{ mb: 1 }}>{enrollError}</Alert>}
          {availLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}><CircularProgress /></Box>
          ) : available.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('students.noAvailable')}
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('users.firstName')} {t('users.lastName')}</TableCell>
                    <TableCell>{t('users.email')}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {available.map(u => (
                    <TableRow key={u.id} hover>
                      <TableCell>{u.firstName} {u.lastName}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell align="right">
                        <Button size="small" variant="outlined" onClick={() => handleEnroll(u.id)}>
                          {t('students.enroll')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEnrollOpen(false)}>{t('common.cancel')}</Button>
        </DialogActions>
      </Dialog>

      {/* Create & Enroll Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('students.createAndEnrollTitle')}</DialogTitle>
        <DialogContent>
          {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t('users.firstName')}
              value={createFirst}
              onChange={e => setCreateFirst(e.target.value)}
              fullWidth
            />
            <TextField
              label={t('users.lastName')}
              value={createLast}
              onChange={e => setCreateLast(e.target.value)}
              fullWidth
            />
            <TextField
              label={t('users.email')}
              type="email"
              value={createEmail}
              onChange={e => setCreateEmail(e.target.value)}
              fullWidth
            />
            <TextField
              label={t('login.password')}
              type="password"
              value={createPass}
              onChange={e => setCreatePass(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleCreateAndEnroll}
            disabled={createSaving || !createFirst || !createLast || !createEmail || !createPass}
          >
            {t('students.createAndEnroll')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Expel Confirmation Dialog */}
      <Dialog open={expelTarget !== null} onClose={() => setExpelTarget(null)}>
        <DialogTitle>{t('students.expelTitle')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('students.expelConfirm', { name: expelTarget?.name ?? '' })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpelTarget(null)}>{t('common.cancel')}</Button>
          <Button variant="contained" color="error" onClick={handleExpelConfirm}>
            {t('students.expel')}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}

export default ViewStudents;
