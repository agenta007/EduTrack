import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Card, CardActionArea, CardContent, CircularProgress,
  FormControl, InputLabel, MenuItem, Select, Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import UserAvatar from '../../components/UserAvatar';
import api from '../../api/axiosInstance';

function SelectTeacherForStatistics() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [teachers, setTeachers] = useState([]);
  const [schools,  setSchools]  = useState([]);
  const [schoolFilter, setSchoolFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/api/users'),
      api.get('/api/schools'),
    ])
      .then(([usersRes, schoolsRes]) => {
        setTeachers(usersRes.data.filter(u => u.role === 'TEACHER'));
        setSchools(schoolsRes.data);
      })
      .catch(() => setError(t('selectTeacher.fetchError')))
      .finally(() => setLoading(false));
  }, []);

  const visible = schoolFilter
    ? teachers.filter(t => t.schoolId === Number(schoolFilter))
    : teachers;

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">{t('selectTeacher.title')}</Typography>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>{t('selectTeacher.allSchools')}</InputLabel>
            <Select
              value={schoolFilter}
              onChange={e => setSchoolFilter(e.target.value)}
              label={t('selectTeacher.allSchools')}
            >
              <MenuItem value=""><em>{t('selectTeacher.allSchools')}</em></MenuItem>
              {schools.map(s => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : visible.length === 0 ? (
          <Typography color="text.secondary">{t('selectTeacher.noTeachers')}</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {visible.map(teacher => (
              <Card key={teacher.id} sx={{ width: 200 }}>
                <CardActionArea onClick={() => navigate(`/statistics/teacher/${teacher.id}`)}>
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <UserAvatar
                      userId={teacher.id}
                      name={`${teacher.firstName} ${teacher.lastName}`}
                      size={48}
                    />
                    <Typography variant="subtitle1" fontWeight="bold" align="center" noWrap sx={{ width: '100%' }}>
                      {teacher.firstName} {teacher.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" align="center" noWrap sx={{ width: '100%' }}>
                      {teacher.schoolName ?? '—'}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Layout>
  );
}

export default SelectTeacherForStatistics;
