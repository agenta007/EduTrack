import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControl, IconButton, InputLabel, List, ListItem, ListItemText,
  MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography, CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import api from '../../api/axiosInstance';

const SCHOOL_TYPES = ['GENERAL', 'FOREIGN_LANGUAGE', 'MATHEMATICS', 'ART', 'SPORTS', 'PROFESSIONAL'];
const ENTRY_TYPES  = ['LECTURE', 'BREAK', 'SPECIAL_EVENT'];
const ENTRY_TYPE_COLORS = { LECTURE: 'primary', BREAK: 'success', SPECIAL_EVENT: 'warning' };
const emptyEntry = { type: 'LECTURE', label: '', startTime: '', endTime: '', eventDate: '' };

const emptyForm = { name: '', address: '', headmasterId: '', type: '' };

const fieldProps = {
  InputProps: { sx: { color: 'black' } },
  InputLabelProps: { shrink: true, sx: { color: 'black', '&.Mui-focused': { color: 'black' } } },
};

function SchoolFormFields({ form, setForm, t, headmasters }) {
  return (
    <>
      <TextField
        label={t('schools.name')}
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        required fullWidth {...fieldProps}
      />
      <TextField
        label={t('schools.address')}
        value={form.address}
        onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
        multiline rows={2} fullWidth {...fieldProps}
      />
      <FormControl fullWidth>
        <InputLabel sx={{ color: 'black' }}>{t('schools.type')}</InputLabel>
        <Select
          value={form.type}
          onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
          label={t('schools.type')} sx={{ color: 'black' }}
        >
          <MenuItem value=""><em>{t('schools.noType')}</em></MenuItem>
          {SCHOOL_TYPES.map(type => (
            <MenuItem key={type} value={type}>{t(`schoolTypes.${type}`)}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth>
        <InputLabel sx={{ color: 'black' }}>{t('schools.headmaster')}</InputLabel>
        <Select
          value={form.headmasterId}
          onChange={e => setForm(f => ({ ...f, headmasterId: e.target.value }))}
          label={t('schools.headmaster')} sx={{ color: 'black' }}
        >
          <MenuItem value=""><em>{t('schools.noHeadmaster')}</em></MenuItem>
          {headmasters.map(h => (
            <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );
}

function ProfileManager({ schoolId, t }) {
  const [profiles, setProfiles]     = useState([]);
  const [newName, setNewName]       = useState('');
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    api.get(`/api/schools/${schoolId}/profiles`)
      .then(res => setProfiles(res.data))
      .finally(() => setLoading(false));
  }, [schoolId]);

  const handleAdd = () => {
    if (!newName.trim()) return;
    api.post(`/api/schools/${schoolId}/profiles`, { name: newName.trim() })
      .then(res => { setProfiles(prev => [...prev, res.data]); setNewName(''); });
  };

  const handleDelete = (id) => {
    api.delete(`/api/schools/profiles/${id}`)
      .then(() => setProfiles(prev => prev.filter(p => p.id !== id)));
  };

  if (loading) return null;

  return (
    <Box>
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle1" sx={{ mb: 1 }}>{t('schools.profiles')}</Typography>
      <List dense disablePadding>
        {profiles.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t('schools.noProfiles')}
          </Typography>
        )}
        {profiles.map(p => (
          <ListItem key={p.id} disablePadding sx={{ mb: 0.5 }}
            secondaryAction={
              <IconButton edge="end" size="small" onClick={() => handleDelete(p.id)}>
                <DeleteIcon fontSize="small" sx={{ color: 'red' }} />
              </IconButton>
            }
          >
            <ListItemText primary={p.name} />
          </ListItem>
        ))}
      </List>
      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <TextField
          size="small"
          label={t('schools.addProfile')}
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          fullWidth
          {...fieldProps}
        />
        <Button variant="outlined" onClick={handleAdd} disabled={!newName.trim()}>
          <AddIcon />
        </Button>
      </Box>
    </Box>
  );
}

function ScheduleManager({ schoolId, t }) {
  const [entries, setEntries]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(emptyEntry);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    api.get(`/api/schools/${schoolId}/schedule`)
      .then(res => setEntries(res.data))
      .finally(() => setLoading(false));
  }, [schoolId]);

  const openAdd = () => { setEditingId(null); setForm(emptyEntry); setShowForm(true); };
  const openEdit = (e) => {
    setEditingId(e.id);
    setForm({ type: e.type, label: e.label, startTime: e.startTime, endTime: e.endTime, eventDate: e.eventDate || '' });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyEntry); };

  const handleSave = () => {
    if (!form.label.trim() || !form.startTime || !form.endTime) return;
    const req = editingId
      ? api.put(`/api/schools/schedule/${editingId}`, form)
      : api.post(`/api/schools/${schoolId}/schedule`, form);
    req.then(res => {
      setEntries(prev =>
        editingId
          ? prev.map(e => e.id === editingId ? res.data : e)
          : [...prev, res.data]
      );
      closeForm();
    });
  };

  const handleDelete = (id) => {
    api.delete(`/api/schools/schedule/${id}`)
      .then(() => setEntries(prev => prev.filter(e => e.id !== id)));
  };

  if (loading) return null;

  return (
    <Box>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1">{t('schools.dailySchedule')}</Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={openAdd}>
          {t('schools.addScheduleEntry')}
        </Button>
      </Box>

      {entries.length === 0 && !showForm && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {t('schools.noScheduleEntries')}
        </Typography>
      )}

      <List dense disablePadding>
        {entries.map(e => (
          <ListItem
            key={e.id} disablePadding sx={{ mb: 0.5, cursor: 'pointer' }}
            onClick={() => openEdit(e)}
            secondaryAction={
              <IconButton edge="end" size="small" onClick={ev => { ev.stopPropagation(); handleDelete(e.id); }}>
                <DeleteIcon fontSize="small" sx={{ color: 'red' }} />
              </IconButton>
            }
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, pr: 5, py: 0.5 }}>
              <Chip
                label={t(`entryTypes.${e.type}`)}
                size="small"
                color={ENTRY_TYPE_COLORS[e.type]}
                sx={{ minWidth: 90 }}
              />
              <Typography variant="body2" sx={{ fontWeight: 500, flexShrink: 0 }}>{e.label}</Typography>
              <Typography variant="body2" color="text.secondary">
                {e.startTime}–{e.endTime}
                {e.eventDate ? ` · ${e.eventDate}` : ''}
              </Typography>
            </Box>
          </ListItem>
        ))}
      </List>

      {showForm && (
        <Box sx={{ mt: 1, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <FormControl size="small" fullWidth>
            <InputLabel sx={{ color: 'black', '&.Mui-focused': { color: 'black' } }}>{t('schools.entryType')}</InputLabel>
            <Select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              label={t('schools.entryType')} sx={{ color: 'black' }}
            >
              {ENTRY_TYPES.map(type => (
                <MenuItem key={type} value={type}>{t(`entryTypes.${type}`)}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small" label={t('schools.entryLabel')} value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            fullWidth {...fieldProps}
          />

          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small" label={t('schools.startTime')} type="time" value={form.startTime}
              onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
              fullWidth {...fieldProps}
            />
            <TextField
              size="small" label={t('schools.endTime')} type="time" value={form.endTime}
              onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
              fullWidth {...fieldProps}
            />
          </Box>

          {form.type === 'SPECIAL_EVENT' && (
            <TextField
              size="small" label={t('schools.eventDate')} type="date" value={form.eventDate}
              onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))}
              fullWidth {...fieldProps}
            />
          )}

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button size="small" onClick={closeForm}>{t('common.cancel')}</Button>
            <Button
              size="small" variant="contained"
              disabled={!form.label.trim() || !form.startTime || !form.endTime}
              onClick={handleSave}
            >
              {t('common.save')}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}

function ViewSchools() {
  const { t } = useTranslation();

  const [schools, setSchools]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [saving, setSaving]           = useState(false);
  const [headmasters, setHeadmasters] = useState([]);

  const [addOpen, setAddOpen]         = useState(false);
  const [addForm, setAddForm]         = useState(emptyForm);

  const [editOpen, setEditOpen]       = useState(false);
  const [editId, setEditId]           = useState(null);
  const [editForm, setEditForm]       = useState(emptyForm);

  const [confirmId, setConfirmId]     = useState(null);
  const [confirmName, setConfirmName] = useState('');

  const fetchSchools = () => {
    setLoading(true);
    setError(null);
    api.get('/api/schools')
      .then(res => setSchools(res.data))
      .catch(() => setError(t('schools.fetchError')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSchools();
    api.get('/api/users/headmasters').then(res => setHeadmasters(res.data)).catch(() => {});
  }, []);

  const toPayload = form => ({
    name: form.name,
    address: form.address,
    type: form.type || null,
    headmasterId: form.headmasterId ? Number(form.headmasterId) : null,
  });

  const handleCreate = () => {
    setSaving(true);
    api.post('/api/schools', toPayload(addForm))
      .then(res => { setSchools(prev => [...prev, res.data]); setAddOpen(false); setAddForm(emptyForm); })
      .catch(() => setError(t('schools.createError')))
      .finally(() => setSaving(false));
  };

  const handleRowClick = (school) => {
    setEditId(school.id);
    const match = headmasters.find(h => h.name === school.headmasterName);
    setEditForm({
      name: school.name || '',
      address: school.address || '',
      type: school.type || '',
      headmasterId: match ? match.id : '',
    });
    setEditOpen(true);
  };

  const handleUpdate = () => {
    setSaving(true);
    api.put(`/api/schools/${editId}`, toPayload(editForm))
      .then(res => { setSchools(prev => prev.map(s => s.id === editId ? res.data : s)); setEditOpen(false); })
      .catch(() => setError(t('schools.updateError')))
      .finally(() => setSaving(false));
  };

  const handleDeleteConfirm = () => {
    api.delete(`/api/schools/${confirmId}`)
      .then(() => { setSchools(prev => prev.filter(s => s.id !== confirmId)); setConfirmId(null); })
      .catch(() => { setError(t('schools.deleteError')); setConfirmId(null); });
  };

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">{t('schools.title')}</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
            {t('schools.addSchool')}
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>{t('schools.name')}</TableCell>
                  <TableCell>{t('schools.type')}</TableCell>
                  <TableCell>{t('schools.headmaster')}</TableCell>
                  <TableCell>{t('schools.profiles')}</TableCell>
                  <TableCell align="center">{t('schools.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {schools.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">{t('schools.noSchools')}</TableCell>
                  </TableRow>
                ) : (
                  schools.map(school => (
                    <TableRow key={school.id} hover onClick={() => handleRowClick(school)} sx={{ cursor: 'pointer' }}>
                      <TableCell>{school.id}</TableCell>
                      <TableCell>{school.name}</TableCell>
                      <TableCell>
                        {school.type
                          ? <Chip label={t(`schoolTypes.${school.type}`)} size="small" />
                          : '—'}
                      </TableCell>
                      <TableCell>{school.headmasterName || '—'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {school.profiles?.length > 0
                            ? school.profiles.map(p => <Chip key={p.id} label={p.name} size="small" variant="outlined" />)
                            : '—'}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton onClick={e => { e.stopPropagation(); setConfirmId(school.id); setConfirmName(school.name); }}>
                          <DeleteIcon sx={{ color: 'red' }} />
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

      {/* Add School Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('schools.addSchool')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <SchoolFormFields form={addForm} setForm={setAddForm} t={t} headmasters={headmasters} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!addForm.name.trim() || saving}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit School Dialog — includes profile manager */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('schools.editSchool')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <SchoolFormFields form={editForm} setForm={setEditForm} t={t} headmasters={headmasters} />
          {editId && <ProfileManager schoolId={editId} t={t} />}
          {editId && <ScheduleManager schoolId={editId} t={t} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleUpdate} disabled={!editForm.name.trim() || saving}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={confirmId !== null} onClose={() => setConfirmId(null)}>
        <DialogTitle>{t('schools.deleteConfirmTitle')}</DialogTitle>
        <DialogContent>
          <Typography>{t('schools.deleteConfirmMessage', { name: confirmName })}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmId(null)}>{t('common.cancel')}</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>{t('common.delete')}</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}

export default ViewSchools;
