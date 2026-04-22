import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography,
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
  const [schoolId,   setSchoolId]   = useState(null);
  const [schoolName, setSchoolName] = useState('');
  const [parentMap,  setParentMap]  = useState({}); // studentId → parentName
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  // Enroll dialog
  const [enrollOpen,    setEnrollOpen]    = useState(false);
  const [available,     setAvailable]     = useState([]);
  const [availLoading,  setAvailLoading]  = useState(false);
  const [enrollError,   setEnrollError]   = useState(null);

  // Expel confirmation dialog
  const [expelTarget, setExpelTarget] = useState(null); // { id, name }
  const [expelError,  setExpelError]  = useState(null);

  useEffect(() => {
    api.get('/api/profile')
      .then(res => {
        const sid = res.data.schoolId;
        setSchoolId(sid);
        setSchoolName(res.data.schoolName || '');
        return Promise.all([
          api.get(`/api/users/students/school/${sid}`),
          api.get(`/api/parents/school/${sid}`),
        ]);
      })
      .then(([studentRes, parentRes]) => {
        setStudents(studentRes.data);
        // Build studentId → parentName map from ParentDto list
        const map = {};
        parentRes.data.forEach(p => {
          p.children.forEach(c => {
            map[c.id] = `${p.firstName} ${p.lastName}`;
          });
        });
        setParentMap(map);
      })
      .catch(() => setError(t('users.fetchError')))
      .finally(() => setLoading(false));
  }, []);

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
      })
      .catch(() => setEnrollError(t('students.enrollError')));
  };

  // ── Expel ─────────────────────────────────────────────────────────────────

  const handleExpelConfirm = () => {
    if (!expelTarget) return;
    api.delete(`/api/students/${expelTarget.id}/expel`)
      .then(() => {
        setStudents(prev => prev.filter(s => s.id !== expelTarget.id));
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
          <Button variant="contained" startIcon={<PersonAddIcon />} onClick={openEnroll}>
            {t('students.enroll')}
          </Button>
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
