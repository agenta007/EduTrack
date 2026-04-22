import React, { useEffect, useState } from 'react';
import { Alert, Box, Card, CardActionArea, CardContent, CircularProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import api from '../../api/axiosInstance';

function SelectClassForGradesView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    api.get('/api/classes')
      .then(res => {
        const map = {};
        res.data.forEach(c => {
          if (!map[c.schoolName]) map[c.schoolName] = [];
          map[c.schoolName].push(c);
        });
        setGrouped(map);
      })
      .catch(() => setError(t('selectClass.fetchError')))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>{t('selectClass.titleGrades')}</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
        ) : (
          Object.entries(grouped).map(([schoolName, classes]) => (
            <Box key={schoolName} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 1, color: 'text.secondary' }}>{schoolName}</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {classes.map(cls => (
                  <Card key={cls.id} sx={{ width: 140 }}>
                    <CardActionArea onClick={() => navigate(`/grades/class/${cls.id}`)}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h5">{cls.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{cls.schoolYear}</Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                ))}
              </Box>
            </Box>
          ))
        )}
      </Box>
    </Layout>
  );
}

export default SelectClassForGradesView;
