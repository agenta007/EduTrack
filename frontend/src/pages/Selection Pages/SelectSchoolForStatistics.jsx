import React, { useEffect, useState } from 'react';
import { Alert, Box, Card, CardActionArea, CardContent, CircularProgress, Chip, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import api from '../../api/axiosInstance';

function SelectSchoolForStatistics() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    api.get('/api/schools')
      .then(res => setSchools(res.data))
      .catch(() => setError(t('selectSchool.fetchError')))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>{t('selectSchool.title')}</Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : schools.length === 0 ? (
          <Typography color="text.secondary">{t('selectSchool.noSchools')}</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {schools.map(school => (
              <Card key={school.id} sx={{ width: 200 }}>
                <CardActionArea onClick={() => navigate(`/statistics/school/${school.id}`)}>
                  <CardContent>
                    <Typography variant="h6" noWrap>{school.name}</Typography>
                    {school.type && (
                      <Chip
                        label={t(`schoolTypes.${school.type}`)}
                        size="small"
                        sx={{ mt: 0.5, mb: 0.5 }}
                      />
                    )}
                    <Typography variant="caption" color="text.secondary" display="block">
                      {school.headmasterName || t('selectSchool.noHeadmaster')}
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

export default SelectSchoolForStatistics;
