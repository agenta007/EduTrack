import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Divider,
  TextField, Typography,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import UserAvatar from '../../components/UserAvatar';
import api from '../../api/axiosInstance';
import useAuth from '../../hooks/useAuth';

const fieldSx = {
  InputProps: { sx: { color: 'black' } },
  InputLabelProps: { shrink: true, sx: { color: 'black', '&.Mui-focused': { color: 'black' } } },
};

function Profile() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const fileInputRef = useRef(null);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [pictureError, setPictureError] = useState(null);

  const [bio, setBio]           = useState('');
  const [bioSaving, setBioSaving] = useState(false);
  const [bioSuccess, setBioSuccess] = useState(false);
  const [bioError, setBioError]   = useState(null);

  const [form, setForm]       = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    api.get('/api/profile').then(res => setBio(res.data.bio ?? ''));
  }, []);

  const handlePictureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setPictureError(null);

    const formData = new FormData();
    formData.append('file', file);
    api.put('/api/profile/picture', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(() => setAvatarVersion(v => v + 1))
      .catch(() => setPictureError(t('profile.pictureError')));
  };

  const handleBioSave = () => {
    setBioError(null);
    setBioSuccess(false);
    setBioSaving(true);
    api.put('/api/profile/bio', { bio })
      .then(() => setBioSuccess(true))
      .catch(() => setBioError(t('profile.bioError')))
      .finally(() => setBioSaving(false));
  };

  const handleSubmit = () => {
    setError(null);
    setSuccess(false);

    if (form.newPassword !== form.confirmPassword) {
      setError(t('profile.passwordMismatch'));
      return;
    }

    setSaving(true);
    api.put('/api/profile/password', {
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    })
      .then(() => {
        setSuccess(true);
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      })
      .catch(err => setError(err.response?.data?.message || t('profile.changeError')))
      .finally(() => setSaving(false));
  };

  return (
    <Layout>
      <Box sx={{ p: 3, maxWidth: 500 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>{t('profile.title')}</Typography>

        {/* User info */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              {/* Clickable avatar + delete */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                <Box
                  sx={{ position: 'relative', cursor: 'pointer' }}
                  onClick={() => fileInputRef.current.click()}
                  title={t('profile.uploadPicture')}
                >
                  <UserAvatar userId={user?.id} name={user?.name} size={72} refreshToken={avatarVersion} />
                  <Box sx={{
                    position: 'absolute', bottom: 0, right: 0,
                    bgcolor: 'primary.main', borderRadius: '50%',
                    width: 22, height: 22,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CameraAltIcon sx={{ fontSize: 13, color: 'white' }} />
                  </Box>
                </Box>
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  sx={{ fontSize: 11 }}
                  onClick={() => {
                    setPictureError(null);
                    api.delete('/api/profile/picture')
                      .then(() => setAvatarVersion(v => v + 1))
                      .catch(() => setPictureError(t('profile.pictureError')));
                  }}
                >
                  {t('profile.deletePicture')}
                </Button>
              </Box>

              <Box>
                <Typography><strong>{t('users.firstName')}:</strong> {user?.name?.split(' ')[0]}</Typography>
                <Typography><strong>{t('users.lastName')}:</strong> {user?.name?.split(' ').slice(1).join(' ')}</Typography>
                <Typography><strong>{t('users.email')}:</strong> {user?.email}</Typography>
                <Typography><strong>{t('users.role')}:</strong> {user?.role}</Typography>
              </Box>
            </Box>

            {pictureError && <Alert severity="error" sx={{ mt: 1 }}>{pictureError}</Alert>}
          </CardContent>
        </Card>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handlePictureChange}
        />

        <Divider sx={{ mb: 3 }} />

        {/* Bio */}
        <Typography variant="h6" sx={{ mb: 2 }}>{t('profile.bio')}</Typography>

        {bioSuccess && <Alert severity="success" sx={{ mb: 2 }}>{t('profile.bioSaved')}</Alert>}
        {bioError   && <Alert severity="error"   sx={{ mb: 2 }}>{bioError}</Alert>}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          <TextField
            placeholder={t('profile.bioPlaceholder')}
            value={bio}
            onChange={e => { setBio(e.target.value.slice(0, 500)); setBioSuccess(false); }}
            multiline
            rows={4}
            fullWidth
            helperText={`${bio.length} / 500`}
            {...fieldSx}
          />
          <Button
            variant="contained"
            onClick={handleBioSave}
            disabled={bioSaving}
            sx={{ alignSelf: 'flex-start' }}
          >
            {t('common.save')}
          </Button>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Change password */}
        <Typography variant="h6" sx={{ mb: 2 }}>{t('profile.changePassword')}</Typography>

        {success && <Alert severity="success" sx={{ mb: 2 }}>{t('profile.changeSuccess')}</Alert>}
        {error   && <Alert severity="error"   sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label={t('profile.currentPassword')}
            type="password"
            value={form.currentPassword}
            onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
            fullWidth
            {...fieldSx}
          />
          <TextField
            label={t('profile.newPassword')}
            type="password"
            value={form.newPassword}
            onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
            fullWidth
            {...fieldSx}
          />
          <TextField
            label={t('profile.confirmPassword')}
            type="password"
            value={form.confirmPassword}
            onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
            fullWidth
            {...fieldSx}
          />
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!form.currentPassword || !form.newPassword || !form.confirmPassword || saving}
          >
            {t('profile.changePassword')}
          </Button>
        </Box>
      </Box>
    </Layout>
  );
}

export default Profile;
