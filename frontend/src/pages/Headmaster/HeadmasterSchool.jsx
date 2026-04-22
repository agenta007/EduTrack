import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Divider, FormControl,
  IconButton, InputLabel, List, ListItem, MenuItem, Paper, Select,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import ClassTimetable from './ClassTimetable';
import api from '../../api/axiosInstance';

const DEFAULT_TERM_CONFIG = {
  startDate: '09-15', term2Start: '02-01',
  elementaryEnd: '06-01', progymnasiumEnd: '06-15', gymnasiumEnd: '07-01',
};

const ENTRY_TYPES = ['LECTURE', 'BREAK', 'SPECIAL_EVENT'];
const ENTRY_TYPE_COLORS = { LECTURE: 'primary', BREAK: 'success', SPECIAL_EVENT: 'warning' };
const emptyEntry = { type: 'LECTURE', label: '', startTime: '', endTime: '', eventDate: '' };

const fieldProps = {
  InputProps: { sx: { color: 'black' } },
  InputLabelProps: { shrink: true, sx: { color: 'black', '&.Mui-focused': { color: 'black' } } },
};

function HeadmasterSchool() {
  const { t } = useTranslation();

  const [school, setSchool]           = useState(null);
  const [schoolId, setSchoolId]       = useState(null);
  const [entries, setEntries]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState(emptyEntry);
  const [editingId, setEditingId]     = useState(null);
  const [saveError, setSaveError]     = useState(null);

  // Term config
  const [termConfig, setTermConfig]   = useState(DEFAULT_TERM_CONFIG);
  const [termSaving, setTermSaving]   = useState(false);
  const [termError, setTermError]     = useState(null);
  const [termSuccess, setTermSuccess] = useState(false);

  // School info edit
  const [editName,    setEditName]    = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [infoSaving,  setInfoSaving]  = useState(false);
  const [infoError,   setInfoError]   = useState(null);
  const [infoSuccess, setInfoSuccess] = useState(false);

  // Student limit
  const [studentLimit,        setStudentLimit]        = useState('');
  const [limitSaving,         setLimitSaving]         = useState(false);
  const [limitError,          setLimitError]          = useState(null);
  const [limitSuccess,        setLimitSuccess]        = useState(false);

  useEffect(() => {
    api.get('/api/profile')
      .then(res => {
        const sid = res.data.schoolId;
        if (!sid) throw new Error('No school');
        setSchoolId(sid);
        return Promise.all([
          api.get(`/api/schools/${sid}`),
          api.get(`/api/schools/${sid}/schedule`),
          api.get(`/api/schools/${sid}/term-config`),
        ]);
      })
      .then(([schoolRes, schedRes, termRes]) => {
        setSchool(schoolRes.data);
        setEditName(schoolRes.data.name || '');
        setEditAddress(schoolRes.data.address || '');
        setEntries(schedRes.data);
        setTermConfig(termRes.data);
        setStudentLimit(schoolRes.data.studentLimit != null ? String(schoolRes.data.studentLimit) : '');
      })
      .catch(() => setError(t('schools.fetchError')))
      .finally(() => setLoading(false));
  }, []);

  const handleInfoSave = () => {
    setInfoSaving(true);
    setInfoError(null);
    setInfoSuccess(false);
    api.patch(`/api/schools/${schoolId}/info`, { name: editName, address: editAddress })
      .then(res => {
        setSchool(res.data);
        setInfoSuccess(true);
      })
      .catch(() => setInfoError(t('schools.infoSaveError')))
      .finally(() => setInfoSaving(false));
  };

  const handleTermSave = () => {
    setTermSaving(true);
    setTermError(null);
    setTermSuccess(false);
    api.put(`/api/schools/${schoolId}/term-config`, termConfig)
      .then(() => setTermSuccess(true))
      .catch(() => setTermError(t('termConfig.saveError')))
      .finally(() => setTermSaving(false));
  };

  const handleLimitSave = () => {
    setLimitSaving(true);
    setLimitError(null);
    setLimitSuccess(false);
    const payload = { studentLimit: studentLimit === '' ? null : parseInt(studentLimit, 10) };
    api.put(`/api/schools/${schoolId}/student-limit`, payload)
      .then(() => setLimitSuccess(true))
      .catch(() => setLimitError(t('schools.limitSaveError')))
      .finally(() => setLimitSaving(false));
  };

  const openAdd = () => { setEditingId(null); setForm(emptyEntry); setSaveError(null); setShowForm(true); };
  const openEdit = (e) => {
    setEditingId(e.id);
    setForm({ type: e.type, label: e.label, startTime: e.startTime, endTime: e.endTime, eventDate: e.eventDate || '' });
    setSaveError(null);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyEntry); };

  const handleSave = () => {
    if (!form.label.trim() || !form.startTime || !form.endTime) return;
    setSaveError(null);
    const req = editingId
      ? api.put(`/api/schools/schedule/${editingId}`, form)
      : api.post(`/api/schools/${school.id}/schedule`, form);
    req
      .then(res => {
        setEntries(prev =>
          editingId
            ? prev.map(e => e.id === editingId ? res.data : e)
            : [...prev, res.data]
        );
        closeForm();
      })
      .catch(() => setSaveError(t('schools.addScheduleEntry') + ' ' + t('schools.fetchError')));
  };

  const handleDelete = (id) => {
    api.delete(`/api/schools/schedule/${id}`)
      .then(() => setEntries(prev => prev.filter(e => e.id !== id)))
      .catch(() => setError(t('schools.deleteError')));
  };

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
      </Layout>
    );
  }

  if (error) {
    return <Layout><Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box></Layout>;
  }

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>{t('nav.mySchool')}</Typography>

        {/* ── School Info ──────────────────────────────────────────────────── */}
        {infoError   && <Alert severity="error"   sx={{ mb: 1 }} onClose={() => setInfoError(null)}>{infoError}</Alert>}
        {infoSuccess && <Alert severity="success" sx={{ mb: 1 }} onClose={() => setInfoSuccess(false)}>{t('schools.infoSaved')}</Alert>}

        <TableContainer component={Paper} sx={{ mb: 1, maxWidth: 560 }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ width: 160, fontWeight: 600 }}>{t('schools.name')}</TableCell>
                <TableCell>
                  <TextField
                    size="small" fullWidth
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    {...fieldProps}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>{t('schools.address')}</TableCell>
                <TableCell>
                  <TextField
                    size="small" fullWidth
                    value={editAddress}
                    onChange={e => setEditAddress(e.target.value)}
                    {...fieldProps}
                  />
                </TableCell>
              </TableRow>
              {school?.type && (
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>{t('schools.type')}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{t(`schoolTypes.${school.type}`)}</Typography>
                  </TableCell>
                </TableRow>
              )}
              {school?.headmasterName && (
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>{t('schools.headmaster')}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{school.headmasterName}</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, maxWidth: 560 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<SaveIcon />}
            onClick={handleInfoSave}
            disabled={infoSaving || !editName.trim()}
          >
            {t('common.save')}
          </Button>
        </Box>

        {/* ── Class Weekly Timetable ───────────────────────────────────────── */}
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" sx={{ mb: 2 }}>{t('schedule.classTimetable')}</Typography>
        {schoolId && <ClassTimetable schoolId={schoolId} canEdit={true} />}

        {/* ── Daily Schedule ──────────────────────────────────────────────── */}
        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">{t('schools.dailySchedule')}</Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={openAdd}>
            {t('schools.addScheduleEntry')}
          </Button>
        </Box>

        {saveError && <Alert severity="error" sx={{ mb: 1 }}>{saveError}</Alert>}

        {entries.length === 0 && !showForm && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t('schools.noScheduleEntries')}
          </Typography>
        )}

        <List dense disablePadding>
          {entries.map(e => (
            <ListItem
              key={e.id}
              disablePadding
              sx={{ mb: 0.5 }}
              secondaryAction={
                <Box>
                  <IconButton size="small" onClick={() => openEdit(e)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(e.id)}>
                    <DeleteIcon fontSize="small" sx={{ color: 'red' }} />
                  </IconButton>
                </Box>
              }
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, pr: 10, py: 0.5 }}>
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

        {/* ── Term Configuration ─────────────────────────────────────── */}
        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" sx={{ mb: 1.5 }}>{t('termConfig.title')}</Typography>

        {termError   && <Alert severity="error"   sx={{ mb: 1 }} onClose={() => setTermError(null)}>{termError}</Alert>}
        {termSuccess && <Alert severity="success" sx={{ mb: 1 }} onClose={() => setTermSuccess(false)}>{t('termConfig.saved')}</Alert>}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxWidth: 360 }}>
          {[
            { key: 'startDate',       label: t('termConfig.startDate') },
            { key: 'term2Start',      label: t('termConfig.term2Start') },
            { key: 'elementaryEnd',   label: t('termConfig.elementaryEnd') },
            { key: 'progymnasiumEnd', label: t('termConfig.progymnasiumEnd') },
            { key: 'gymnasiumEnd',    label: t('termConfig.gymnasiumEnd') },
          ].map(({ key, label }) => (
            <TextField
              key={key}
              size="small"
              label={label}
              value={termConfig[key]}
              placeholder="MM-dd"
              onChange={e => setTermConfig(c => ({ ...c, [key]: e.target.value }))}
              fullWidth
              {...fieldProps}
            />
          ))}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleTermSave}
              disabled={termSaving}
              size="small"
            >
              {t('common.save')}
            </Button>
          </Box>
        </Box>

        {/* ── Student Limit ──────────────────────────────────────────────── */}
        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" sx={{ mb: 1.5 }}>{t('schools.studentLimit')}</Typography>

        {limitError   && <Alert severity="error"   sx={{ mb: 1 }} onClose={() => setLimitError(null)}>{limitError}</Alert>}
        {limitSuccess && <Alert severity="success" sx={{ mb: 1 }} onClose={() => setLimitSuccess(false)}>{t('schools.limitSaved')}</Alert>}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, maxWidth: 360 }}>
          <TextField
            size="small"
            label={t('schools.studentLimitLabel')}
            value={studentLimit}
            placeholder={t('schools.studentLimitPlaceholder')}
            type="number"
            inputProps={{ min: 0 }}
            onChange={e => setStudentLimit(e.target.value)}
            fullWidth
            {...fieldProps}
          />
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleLimitSave}
            disabled={limitSaving}
            size="small"
            sx={{ whiteSpace: 'nowrap' }}
          >
            {t('common.save')}
          </Button>
        </Box>

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
    </Layout>
  );
}

export default HeadmasterSchool;
