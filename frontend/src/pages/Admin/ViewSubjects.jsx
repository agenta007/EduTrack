import React, { useEffect, useState } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Paper,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography, CircularProgress, Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import api from '../../api/axiosInstance';
import useAuth from '../../hooks/useAuth';

const emptyForm = { name: '' };

const fieldProps = {
  InputProps: { sx: { color: 'black' } },
  InputLabelProps: { shrink: true, sx: { color: 'black', '&.Mui-focused': { color: 'black' } } },
};

function SubjectFormFields({ form, setForm, t }) {
  // Render a single controlled input field for the subject name
  return (
    <TextField
      label={t('subjects.name')}
      // Bind the input value to the subject name in the form state
      value={form.name}
      // Update the subject name in the form state on every keystroke
      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
      required
      fullWidth
      {...fieldProps}
    />
  );
}

function ViewSubjects() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN';

  const [subjects, setSubjects]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [saving, setSaving]         = useState(false);

  // Add dialog
  const [addOpen, setAddOpen]       = useState(false);
  const [addForm, setAddForm]       = useState(emptyForm);

  // Edit dialog
  const [editOpen, setEditOpen]     = useState(false);
  const [editId, setEditId]         = useState(null);
  const [editForm, setEditForm]     = useState(emptyForm);

  // Delete confirm
  const [confirmId, setConfirmId]   = useState(null);
  const [confirmName, setConfirmName] = useState('');

  const fetchSubjects = () => {
    setLoading(true);
    setError(null);
    api.get('/api/subjects')
      .then(res => setSubjects(res.data))
      .catch(() => setError(t('subjects.fetchError')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSubjects(); }, []);

  const handleCreate = () => {
    setSaving(true);
    api.post('/api/subjects', { name: addForm.name })
      .then(res => {
        setSubjects(prev => [...prev, res.data]);
        setAddOpen(false);
        setAddForm(emptyForm);
      })
      .catch(() => setError(t('subjects.createError')))
      .finally(() => setSaving(false));
  };

  const handleRowClick = (subject) => {
    setEditId(subject.id);
    setEditForm({ name: subject.name });
    setEditOpen(true);
  };

  const handleUpdate = () => {
    setSaving(true);
    api.put(`/api/subjects/${editId}`, { name: editForm.name })
      .then(res => {
        setSubjects(prev => prev.map(s => s.id === editId ? res.data : s));
        setEditOpen(false);
      })
      .catch(() => setError(t('subjects.updateError')))
      .finally(() => setSaving(false));
  };

  const handleDeleteConfirm = () => {
    api.delete(`/api/subjects/${confirmId}`)
      .then(() => {
        setSubjects(prev => prev.filter(s => s.id !== confirmId));
        setConfirmId(null);
      })
      .catch(() => {
        setError(t('subjects.deleteError'));
        setConfirmId(null);
      });
  };

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">{t('subjects.title')}</Typography>
          {canEdit && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
              {t('subjects.addSubject')}
            </Button>
          )}
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>{t('subjects.name')}</TableCell>
                  {canEdit && <TableCell align="center">{t('subjects.actions')}</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {subjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canEdit ? 3 : 2} align="center">{t('subjects.noSubjects')}</TableCell>
                  </TableRow>
                ) : (
                  subjects.map(subject => (
                    <TableRow
                      key={subject.id}
                      hover
                      onClick={() => canEdit && handleRowClick(subject)}
                      sx={{ cursor: canEdit ? 'pointer' : 'default' }}
                    >
                      <TableCell>{subject.id}</TableCell>
                      <TableCell>{subject.name}</TableCell>
                      {canEdit && (
                        <TableCell align="center">
                          <IconButton onClick={e => { e.stopPropagation(); setConfirmId(subject.id); setConfirmName(subject.name); }}>
                            <DeleteIcon sx={{ color: 'red' }} />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Add Subject Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('subjects.addSubject')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <SubjectFormFields form={addForm} setForm={setAddForm} t={t} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!addForm.name.trim() || saving}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Subject Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('subjects.editSubject')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <SubjectFormFields form={editForm} setForm={setEditForm} t={t} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleUpdate} disabled={!editForm.name.trim() || saving}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmId !== null} onClose={() => setConfirmId(null)}>
        <DialogTitle>{t('subjects.deleteConfirmTitle')}</DialogTitle>
        <DialogContent>
          <Typography>{t('subjects.deleteConfirmMessage', { name: confirmName })}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmId(null)}>{t('common.cancel')}</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}

export default ViewSubjects;
