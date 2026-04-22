import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogContent,
  DialogTitle, FormControl, IconButton, InputLabel, MenuItem, Paper,
  Select, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import EditIcon      from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AddIcon       from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import UserAvatar from '../../components/UserAvatar';
import api from '../../api/axiosInstance';

function ViewParents() {
  const { t } = useTranslation();

  const [parents,    setParents]    = useState([]);
  const [schoolId,   setSchoolId]   = useState(null);
  const [schoolName, setSchoolName] = useState('');
  const [students,   setStudents]   = useState([]); // enrolled students for link dialog
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  // ── Add Parent ──────────────────────────────────────────────────────────────
  const [addOpen,   setAddOpen]   = useState(false);
  const [addFirst,  setAddFirst]  = useState('');
  const [addLast,   setAddLast]  = useState('');
  const [addEmail,  setAddEmail]  = useState('');
  const [addError,  setAddError]  = useState(null);
  const [addSaving, setAddSaving] = useState(false);

  // ── Link dialog ─────────────────────────────────────────────────────────────
  const [linkOpen,      setLinkOpen]      = useState(false);
  const [availParents,  setAvailParents]  = useState([]);
  const [availLoading,  setAvailLoading]  = useState(false);
  const [availError,    setAvailError]    = useState(null);
  const [linkParentId,  setLinkParentId]  = useState('');
  const [linkStudentId, setLinkStudentId] = useState('');
  const [linkError,     setLinkError]     = useState(null);
  const [linkSaving,    setLinkSaving]    = useState(false);

  // ── Unlink confirmation ──────────────────────────────────────────────────────
  const [unlinkTarget, setUnlinkTarget] = useState(null); // { parentId, parentName, studentId, studentName }
  const [unlinkError,  setUnlinkError]  = useState(null);

  // ── Edit dialog ──────────────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState(null); // ParentDto
  const [editFirst,  setEditFirst]  = useState('');
  const [editLast,   setEditLast]   = useState('');
  const [editEmail,  setEditEmail]  = useState('');
  const [editError,  setEditError]  = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  // ── Load ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    api.get('/api/profile')
        .then(res => {
          const sid = res.data.schoolId;
          setSchoolId(sid);
          setSchoolName(res.data.schoolName || '');
          return Promise.all([
            api.get(`/api/parents/school/${sid}`),
            api.get(`/api/users/students/school/${sid}`),
          ]);
        })
        .then(([parentRes, studentRes]) => {
          setParents(parentRes.data);
          setStudents(studentRes.data);
        })
        .catch(() => setError(t('parents.fetchError')))
        .finally(() => setLoading(false));
  }, [t]);

  // ── Add Parent ──────────────────────────────────────────────────────────────

  const openAdd = () => {
    setAddOpen(true);
    setAddFirst('');
    setAddLast('');
    setAddEmail('');
    setAddError(null);
  };

  const handleAddSave = () => {
    setAddSaving(true);
    setAddError(null);
    api.post('/api/parents', {
      firstName: addFirst,
      lastName: addLast,
      email: addEmail,
      schoolId: schoolId,
    })
        .then(res => {
          // Ensure new parent has an empty children array to prevent rendering errors
          const newParent = { ...res.data, children: res.data.children || [] };
          setParents(prev => [...prev, newParent]);
          setAddOpen(false);
        })
        .catch(() => setAddError(t('parents.addError') || 'Грешка при добавяне'))
        .finally(() => setAddSaving(false));
  };

  // ── Link ──────────────────────────────────────────────────────────────────────

  const openLink = () => {
    setLinkOpen(true);
    setLinkError(null);
    setAvailError(null);
    setLinkParentId('');
    setLinkStudentId('');
    setAvailLoading(true);
    api.get('/api/parents/available')
        .then(res => setAvailParents(res.data))
        .catch(() => setAvailError(t('parents.fetchAvailableError')))
        .finally(() => setAvailLoading(false));
  };

  const handleLink = () => {
    if (!linkParentId || !linkStudentId) return;
    setLinkSaving(true);
    setLinkError(null);
    api.post(`/api/parents/${linkParentId}/link/${linkStudentId}`)
        .then(res => {
          const updated = res.data;
          setParents(prev => {
            const exists = prev.find(p => p.id === updated.id);
            return exists
                ? prev.map(p => p.id === updated.id ? updated : p)
                : [...prev, updated];
          });
          setLinkOpen(false);
        })
        .catch(() => setLinkError(t('parents.linkError')))
        .finally(() => setLinkSaving(false));
  };

  // ── Unlink ────────────────────────────────────────────────────────────────────

  const handleUnlink = () => {
    if (!unlinkTarget) return;
    setUnlinkError(null);
    api.delete(`/api/parents/${unlinkTarget.parentId}/unlink/${unlinkTarget.studentId}`)
        .then(() => {
          setParents(prev => prev
              .map(p => p.id === unlinkTarget.parentId
                  ? { ...p, children: p.children.filter(c => c.id !== unlinkTarget.studentId) }
                  : p
              )
              .filter(p => p.children.length > 0)
          );
          setUnlinkTarget(null);
        })
        .catch(() => setUnlinkError(t('parents.unlinkError')));
  };

  // ── Edit ──────────────────────────────────────────────────────────────────────

  const openEdit = (parent) => {
    setEditTarget(parent);
    setEditFirst(parent.firstName);
    setEditLast(parent.lastName);
    setEditEmail(parent.email);
    setEditError(null);
  };

  const handleEditSave = () => {
    setEditSaving(true);
    setEditError(null);
    api.put(`/api/parents/${editTarget.id}`, {
      firstName: editFirst,
      lastName:  editLast,
      email:     editEmail,
    })
        .then(res => {
          setParents(prev => prev.map(p => p.id === res.data.id ? res.data : p));
          setEditTarget(null);
        })
        .catch(() => setEditError(t('parents.editError')))
        .finally(() => setEditSaving(false));
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
      <Layout>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box>
              <Typography variant="h5">{t('nav.parents')}</Typography>
              {schoolName && (
                  <Typography variant="body2" color="text.secondary">{schoolName}</Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
                {t('parents.addParent') || 'Добави'}
              </Button>
              <Button size="small" variant="outlined" startIcon={<PersonAddIcon />} onClick={openLink}>
                {t('parents.link')}
              </Button>
            </Box>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            Един ученик може да има само един родител/настойник! (родителите споделят един профил)
          </Alert>

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
                      <TableCell>{t('parents.children')}</TableCell>
                      <TableCell sx={{ width: 60 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center">{t('users.noUsers')}</TableCell>
                        </TableRow>
                    ) : (
                        parents.map(p => (
                            <TableRow key={p.id} hover>
                              <TableCell>
                                <UserAvatar userId={p.id} name={`${p.firstName} ${p.lastName}`} size={36} />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={500}>{p.firstName} {p.lastName}</Typography>
                                <Typography variant="caption" color="text.secondary">{p.email}</Typography>
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                  {p.children.length === 0 ? (
                                      <Typography variant="caption" color="text.disabled">—</Typography>
                                  ) : (
                                      p.children.map(c => (
                                          <Chip
                                              key={c.id}
                                              label={c.name}
                                              size="small"
                                              onDelete={() => setUnlinkTarget({
                                                parentId:    p.id,
                                                parentName:  `${p.firstName} ${p.lastName}`,
                                                studentId:   c.id,
                                                studentName: c.name,
                                              })}
                                          />
                                      ))
                                  )}
                                </Stack>
                              </TableCell>
                              <TableCell align="right">
                                <Tooltip title={t('parents.editTitle')}>
                                  <IconButton size="small" onClick={() => openEdit(p)}>
                                    <EditIcon fontSize="small" />
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

          {/* ── Add Parent dialog ──────────────────────────────────────────────── */}
          <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle>{t('parents.addParent') || 'Добави родител'}</DialogTitle>
            <DialogContent>
              {addError && <Alert severity="error" sx={{ mb: 1, mt: 1 }}>{addError}</Alert>}
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                    autoFocus
                    size="small"
                    fullWidth
                    label={t('users.firstName')}
                    value={addFirst}
                    onChange={e => setAddFirst(e.target.value)}
                />
                <TextField
                    size="small"
                    fullWidth
                    label={t('users.lastName')}
                    value={addLast}
                    onChange={e => setAddLast(e.target.value)}
                />
                <TextField
                    size="small"
                    fullWidth
                    label={t('users.email')}
                    value={addEmail}
                    onChange={e => setAddEmail(e.target.value)}
                />
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button size="small" onClick={() => setAddOpen(false)}>{t('common.cancel')}</Button>
                  <Button size="small" variant="contained" onClick={handleAddSave} disabled={addSaving || !addFirst || !addLast || !addEmail}>
                    {t('common.save')}
                  </Button>
                </Box>
              </Stack>
            </DialogContent>
          </Dialog>

          {/* ── Link dialog ────────────────────────────────────────────────────── */}
          <Dialog open={linkOpen} onClose={() => setLinkOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle>{t('parents.linkTitle')}</DialogTitle>
            <DialogContent>
              {availError && <Alert severity="error" sx={{ mb: 1 }}>{availError}</Alert>}
              {linkError  && <Alert severity="error" sx={{ mb: 1 }}>{linkError}</Alert>}
              {availLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress /></Box>
              ) : (
                  <Stack spacing={2} sx={{ mt: 1 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>{t('parents.selectParent')}</InputLabel>
                      <Select
                          value={linkParentId}
                          label={t('parents.selectParent')}
                          onChange={e => setLinkParentId(e.target.value)}
                      >
                        {availParents.map(u => (
                            <MenuItem key={u.id} value={u.id}>
                              {u.firstName} {u.lastName}
                            </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {(() => {
                      const unlinked = students.filter(
                          s => !parents.some(p => p.children.some(c => c.id === s.id))
                      );
                      return unlinked.length === 0 ? (
                          <Alert severity="success">
                            Всички ученически профили са свързани с родителски такива.
                          </Alert>
                      ) : (
                          <FormControl fullWidth size="small">
                            <InputLabel>{t('parents.selectStudent')}</InputLabel>
                            <Select
                                value={linkStudentId}
                                label={t('parents.selectStudent')}
                                onChange={e => setLinkStudentId(e.target.value)}
                            >
                              {unlinked.map(s => (
                                  <MenuItem key={s.id} value={s.id}>
                                    {s.firstName} {s.lastName}
                                  </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                      );
                    })()}
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button size="small" onClick={() => setLinkOpen(false)}>{t('common.cancel')}</Button>
                      <Button
                          size="small"
                          variant="contained"
                          disabled={!linkParentId || !linkStudentId || linkSaving}
                          onClick={handleLink}
                      >
                        {t('parents.link')}
                      </Button>
                    </Box>
                  </Stack>
              )}
            </DialogContent>
          </Dialog>

          {/* ── Unlink confirmation ───────────────────────────────────────────── */}
          <Dialog open={!!unlinkTarget} onClose={() => setUnlinkTarget(null)} maxWidth="xs" fullWidth>
            <DialogTitle>{t('parents.unlinkTitle')}</DialogTitle>
            <DialogContent>
              {unlinkError && <Alert severity="error" sx={{ mb: 1 }}>{unlinkError}</Alert>}
              <Typography sx={{ mb: 2 }}>
                {t('parents.unlinkConfirm', {
                  parentName:  unlinkTarget?.parentName,
                  studentName: unlinkTarget?.studentName,
                })}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button size="small" onClick={() => setUnlinkTarget(null)}>{t('common.cancel')}</Button>
                <Button size="small" variant="contained" color="error" onClick={handleUnlink}>
                  {t('parents.unlink')}
                </Button>
              </Box>
            </DialogContent>
          </Dialog>

          {/* ── Edit dialog ───────────────────────────────────────────────────── */}
          <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="xs" fullWidth>
            <DialogTitle>{t('parents.editTitle')} — {editTarget?.firstName} {editTarget?.lastName}</DialogTitle>
            <DialogContent>
              {editError && <Alert severity="error" sx={{ mb: 1 }}>{editError}</Alert>}
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                    autoFocus
                    size="small"
                    fullWidth
                    label={t('users.firstName')}
                    value={editFirst}
                    onChange={e => setEditFirst(e.target.value)}
                />
                <TextField
                    size="small"
                    fullWidth
                    label={t('users.lastName')}
                    value={editLast}
                    onChange={e => setEditLast(e.target.value)}
                />
                <TextField
                    size="small"
                    fullWidth
                    label={t('users.email')}
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                />
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button size="small" onClick={() => setEditTarget(null)}>{t('common.cancel')}</Button>
                  <Button size="small" variant="contained" onClick={handleEditSave} disabled={editSaving}>
                    {t('common.save')}
                  </Button>
                </Box>
              </Stack>
            </DialogContent>
          </Dialog>
        </Box>
      </Layout>
  );
}

export default ViewParents;