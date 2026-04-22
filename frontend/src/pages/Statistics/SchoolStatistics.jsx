import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Chip, CircularProgress, Divider, Paper,
  Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tabs, Typography,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import api from '../../api/axiosInstance';

// ── Helpers ────────────────────────────────────────────────────────────────────

const gradeChipColor = avg => {
  // Determine the MUI Chip color based on the student's average grade
  if (avg === null || avg === undefined) return 'default';
  // High grades (5.5 - 6.0) use success (green)
  if (avg >= 5.5) return 'success';
  // Good grades (4.5 - 5.0) use primary (blue)
  if (avg >= 4.5) return 'primary';
  // Passing grades (3.5 - 4.0) use warning (orange)
  if (avg >= 3.5) return 'warning';
  // Failing grades (below 3.5) use error (red)
  return 'error';
};

// Formats a numeric value as a rounded percentage string (e.g., 0.856 -> "86%")
const fmtPct = n => `${n.toFixed(0)}%`;

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({ label, value }) {
  return (
    <Paper elevation={2} sx={{ p: 2, flex: 1, minWidth: 110, textAlign: 'center' }}>
      <Typography variant="h4" fontWeight={700} color="primary">{value ?? '—'}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Paper>
  );
}

// Proportional bar — fills relative to `total` (used for distributions)
function DistBar({ label, count, total, color }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
      <Typography variant="body2" sx={{ width: 195, flexShrink: 0 }}>{label}</Typography>
      <Box sx={{ flex: 1, bgcolor: 'grey.100', borderRadius: 1, height: 14, overflow: 'hidden' }}>
        <Box sx={{
          width: `${pct}%`, bgcolor: color, height: '100%', borderRadius: 1,
          minWidth: count > 0 ? 4 : 0, transition: 'width 0.4s ease',
        }} />
      </Box>
      <Typography variant="body2" sx={{ width: 28, textAlign: 'right', fontWeight: 600 }}>{count}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ width: 44, textAlign: 'right' }}>
        {total > 0 ? fmtPct(pct) : '—'}
      </Typography>
    </Box>
  );
}

// Relative bar — fills relative to max value (used for per-class comparisons)
function RelBar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
      <Typography variant="body2" sx={{ width: 160, flexShrink: 0 }}>{label}</Typography>
      <Box sx={{ flex: 1, bgcolor: 'grey.100', borderRadius: 1, height: 14, overflow: 'hidden' }}>
        <Box sx={{
          width: `${pct}%`, bgcolor: color, height: '100%', borderRadius: 1,
          minWidth: value > 0 ? 4 : 0, transition: 'width 0.4s ease',
        }} />
      </Box>
      <Typography variant="body2" sx={{ width: 28, textAlign: 'right', fontWeight: 600 }}>{value}</Typography>
    </Box>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

function SchoolStatistics() {
  const { schoolId } = useParams();
  const { t } = useTranslation();

  const [school,    setSchool]    = useState(null);
  const [classes,   setClasses]   = useState([]);
  const [teachers,  setTeachers]  = useState([]);
  const [students,  setStudents]  = useState([]);
  const [classData, setClassData] = useState({}); // classId → { grades, absences }
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [termTab,   setTermTab]   = useState(0);  // 0=All 1=Term1 2=Term2

  // ── Data fetching ────────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    setError(null);

    let schoolClasses = [];

    Promise.all([
      api.get(`/api/schools/${schoolId}`),
      api.get('/api/classes'),
      api.get(`/api/users/teachers/school/${schoolId}`),
      api.get(`/api/users/students/school/${schoolId}`),
    ])
      .then(([schoolRes, classesRes, teachersRes, studentsRes]) => {
        setSchool(schoolRes.data);
        schoolClasses = classesRes.data.filter(c => c.schoolId === Number(schoolId));
        setClasses(schoolClasses);
        setTeachers(teachersRes.data);
        setStudents(studentsRes.data);

        return Promise.all(
          schoolClasses.map(cls =>
            Promise.all([
              api.get(`/api/grades/class/${cls.id}`),
              api.get(`/api/absences/class/${cls.id}`),
            ]).then(([g, a]) => ({ classId: cls.id, grades: g.data, absences: a.data }))
          )
        );
      })
      .then(results => {
        const data = {};
        results.forEach(r => { data[r.classId] = { grades: r.grades, absences: r.absences }; });
        setClassData(data);
      })
      .catch(() => setError(t('stats.fetchError')))
      .finally(() => setLoading(false));
  }, [schoolId]);

  // ── Derived statistics ───────────────────────────────────────────────────────

  const termFilter = termTab === 0 ? null : termTab;

  const allGrades   = useMemo(() => Object.values(classData).flatMap(d => d.grades),   [classData]);
  const allAbsences = useMemo(() => Object.values(classData).flatMap(d => d.absences), [classData]);

  const grades   = useMemo(
    () => termFilter ? allGrades.filter(g => g.term === termFilter)   : allGrades,
    [allGrades, termFilter]
  );
  const absences = useMemo(
    () => termFilter ? allAbsences.filter(a => a.term === termFilter) : allAbsences,
    [allAbsences, termFilter]
  );

  const schoolAvg = useMemo(() => {
    if (!grades.length) return null;
    return grades.reduce((s, g) => s + parseFloat(g.value), 0) / grades.length;
  }, [grades]);

  const gradeDist = useMemo(() => {
    const d = { fail: 0, satisfactory: 0, good: 0, veryGood: 0, excellent: 0 };
    grades.forEach(g => {
      const v = parseFloat(g.value);
      if (v < 3)        d.fail++;
      else if (v < 4)   d.satisfactory++;
      else if (v < 5)   d.good++;
      else if (v < 5.5) d.veryGood++;
      else              d.excellent++;
    });
    return d;
  }, [grades]);

  // Per-class summary — sorted by avg desc
  const classStats = useMemo(() => {
    return classes.map(cls => {
      const cg = (classData[cls.id]?.grades   || []).filter(g => !termFilter || g.term === termFilter);
      const ca = (classData[cls.id]?.absences || []).filter(a => !termFilter || a.term === termFilter);
      const avg      = cg.length ? cg.reduce((s, g) => s + parseFloat(g.value), 0) / cg.length : null;
      const excused  = ca.filter(a => a.excused).length;
      const passRate = cg.length ? (cg.filter(g => parseFloat(g.value) >= 3).length / cg.length) * 100 : null;
      return {
        id: cls.id, name: cls.name, schoolYear: cls.schoolYear,
        gradeCount: cg.length, avg, passRate,
        totalAbsences: ca.length, excused, unexcused: ca.length - excused,
      };
    }).sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));
  }, [classes, classData, termFilter]);

  // Per-subject grade stats — sorted by avg desc
  const subjectGradeStats = useMemo(() => {
    const map = {};
    grades.forEach(g => {
      if (!map[g.subjectName]) map[g.subjectName] = [];
      map[g.subjectName].push(parseFloat(g.value));
    });
    return Object.entries(map)
      .map(([name, vals]) => ({
        name,
        count:    vals.length,
        avg:      vals.reduce((s, v) => s + v, 0) / vals.length,
        failRate: (vals.filter(v => v < 3).length / vals.length) * 100,
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [grades]);

  // Per-teacher grade stats — sorted by count desc
  const teacherGradeStats = useMemo(() => {
    const map = {};
    grades.forEach(g => {
      if (!map[g.teacherName]) map[g.teacherName] = [];
      map[g.teacherName].push(parseFloat(g.value));
    });
    return Object.entries(map)
      .map(([name, vals]) => ({
        name,
        count:    vals.length,
        avg:      vals.reduce((s, v) => s + v, 0) / vals.length,
        failRate: (vals.filter(v => v < 3).length / vals.length) * 100,
      }))
      .sort((a, b) => b.count - a.count);
  }, [grades]);

  // Per-student grade stats — top 5 / bottom 5
  const studentGradeStats = useMemo(() => {
    const map = {};
    grades.forEach(g => {
      if (!map[g.studentId]) map[g.studentId] = { name: g.studentName, vals: [] };
      map[g.studentId].vals.push(parseFloat(g.value));
    });
    return Object.values(map)
      .map(d => ({ name: d.name, count: d.vals.length, avg: d.vals.reduce((s, v) => s + v, 0) / d.vals.length }))
      .sort((a, b) => b.avg - a.avg);
  }, [grades]);

  // Per-student absence stats — top 5 most absent
  const studentAbsenceStats = useMemo(() => {
    const map = {};
    absences.forEach(a => {
      if (!map[a.studentId]) map[a.studentId] = { name: a.studentName, total: 0, unexcused: 0 };
      map[a.studentId].total++;
      if (!a.excused) map[a.studentId].unexcused++;
    });
    return Object.values(map)
      .map(d => ({ name: d.name, total: d.total, unexcused: d.unexcused }))
      .sort((a, b) => b.total - a.total);
  }, [absences]);

  // Per-subject absence breakdown — sorted by total desc
  const subjectAbsenceStats = useMemo(() => {
    const map = {};
    absences.forEach(a => {
      if (!map[a.subjectName]) map[a.subjectName] = { total: 0, excused: 0 };
      map[a.subjectName].total++;
      if (a.excused) map[a.subjectName].excused++;
    });
    return Object.entries(map)
      .map(([name, d]) => ({ name, total: d.total, excused: d.excused, unexcused: d.total - d.excused }))
      .sort((a, b) => b.total - a.total);
  }, [absences]);

  // Risk indicators
  const riskClasses   = classStats.filter(c => c.avg !== null && c.avg < 3.5);
  const riskSubjects  = subjectGradeStats.filter(s => s.failRate > 15);
  const hasRisks      = riskClasses.length > 0 || riskSubjects.length > 0;

  const excusedAbsences   = absences.filter(a => a.excused).length;
  const unexcusedAbsences = absences.length - excusedAbsences;
  const maxClassAbsences  = Math.max(...classStats.map(c => c.totalAbsences), 1);

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ p: 3 }}>

        {/* ── Header ── */}
        <Box sx={{ mb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="h5" fontWeight={700}>{school?.name}</Typography>
            {school?.type && (
              <Chip label={t(`schoolTypes.${school.type}`)} size="small" color="primary" />
            )}
          </Box>
          {school?.headmasterName && (
            <Typography variant="body2" color="text.secondary">{school.headmasterName}</Typography>
          )}
          {school?.address && (
            <Typography variant="body2" color="text.disabled">{school.address}</Typography>
          )}
        </Box>

        {/* ── Term filter ── */}
        <Tabs value={termTab} onChange={(_, v) => setTermTab(v)} sx={{ mb: 3, mt: 1 }}>
          <Tab label={t('grades.all')} />
          <Tab label={t('schedule.term1')} />
          <Tab label={t('schedule.term2')} />
        </Tabs>

        {/* ══ SECTION 1 — Overview KPIs ══ */}
        <Typography variant="h6" sx={{ mb: 1.5 }}>{t('stats.overview')}</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
          <StatCard label={t('stats.students')}      value={students.length} />
          <StatCard label={t('stats.teachers')}      value={teachers.length} />
          <StatCard label={t('stats.classes')}       value={classes.length}  />
          <StatCard label={t('stats.profiles')}      value={school?.profiles?.length ?? 0} />
          <StatCard label={t('stats.totalGrades')}   value={grades.length}   />
          <StatCard label={t('stats.totalAbsences')} value={absences.length} />
          {schoolAvg !== null && (
            <StatCard label={t('stats.schoolAvg')} value={schoolAvg.toFixed(2)} />
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* ══ SECTION 2 — Risk Indicators ══ */}
        <Typography variant="h6" sx={{ mb: 1.5 }}>{t('stats.riskIndicators')}</Typography>
        {!hasRisks ? (
          <Alert severity="success" sx={{ mb: 4 }}>{t('stats.noRisks')}</Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 4 }}>
            {riskClasses.map(c => (
              <Alert key={c.id} severity={c.avg < 3.0 ? 'error' : 'warning'} sx={{ py: 0.5 }}>
                <strong>{c.name}</strong> ({c.schoolYear})
                {' — '}{t('stats.atRiskGrade')}: {c.avg.toFixed(2)}
              </Alert>
            ))}
            {riskSubjects.map(s => (
              <Alert key={s.name} severity="warning" sx={{ py: 0.5 }}>
                <strong>{s.name}</strong>
                {' — '}{t('stats.highFailRate')}: {fmtPct(s.failRate)}
              </Alert>
            ))}
          </Box>
        )}

        <Divider sx={{ mb: 3 }} />

        {/* ══ SECTION 3 — Class Breakdown ══ */}
        <Typography variant="h6" sx={{ mb: 2 }}>{t('stats.classBreakdown')}</Typography>

        {classStats.length === 0 ? (
          <Typography color="text.secondary" sx={{ mb: 4 }}>{t('stats.noData')}</Typography>
        ) : (
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('stats.class')}</TableCell>
                  <TableCell align="right">{t('stats.totalGrades')}</TableCell>
                  <TableCell align="right">{t('stats.avgGrade')}</TableCell>
                  <TableCell align="right">{t('stats.passRate')}</TableCell>
                  <TableCell align="right">{t('stats.totalAbsences')}</TableCell>
                  <TableCell align="right">{t('absences.excusedCount')}</TableCell>
                  <TableCell align="right">{t('absences.unexcusedCount')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {classStats.map(cs => (
                  <TableRow key={cs.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                        <Typography variant="body2" fontWeight={600}>{cs.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{cs.schoolYear}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">{cs.gradeCount}</TableCell>
                    <TableCell align="right">
                      {cs.avg !== null
                        ? <Chip label={cs.avg.toFixed(2)} size="small" color={gradeChipColor(cs.avg)} />
                        : '—'}
                    </TableCell>
                    <TableCell align="right">
                      {cs.passRate !== null ? fmtPct(cs.passRate) : '—'}
                    </TableCell>
                    <TableCell align="right">{cs.totalAbsences}</TableCell>
                    <TableCell align="right">
                      <Chip label={cs.excused}   size="small" color="success" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      <Chip label={cs.unexcused} size="small" color="error"   variant="outlined" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Divider sx={{ mb: 3 }} />

        {/* ══ SECTION 4 — Grade Statistics ══ */}
        <Typography variant="h6" sx={{ mb: 2 }}>{t('stats.gradeStats')}</Typography>

        {grades.length === 0 ? (
          <Typography color="text.secondary" sx={{ mb: 4 }}>{t('stats.noData')}</Typography>
        ) : (
          <>
            {/* 4a — Grade distribution */}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
              {t('stats.gradeDist')}
            </Typography>
            <Box sx={{ mb: 3, maxWidth: 580 }}>
              <DistBar label={t('stats.gradeLabels.excellent')}    count={gradeDist.excellent}    total={grades.length} color="#4caf50" />
              <DistBar label={t('stats.gradeLabels.veryGood')}     count={gradeDist.veryGood}     total={grades.length} color="#8bc34a" />
              <DistBar label={t('stats.gradeLabels.good')}         count={gradeDist.good}         total={grades.length} color="#ff9800" />
              <DistBar label={t('stats.gradeLabels.satisfactory')} count={gradeDist.satisfactory} total={grades.length} color="#ff5722" />
              <DistBar label={t('stats.gradeLabels.fail')}         count={gradeDist.fail}         total={grades.length} color="#f44336" />
            </Box>

            {/* 4b — Subject averages + fail rate */}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              {t('stats.subjectGradeBreakdown')}
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('stats.subject')}</TableCell>
                    <TableCell align="right">{t('stats.count')}</TableCell>
                    <TableCell align="right">{t('stats.avgGrade')}</TableCell>
                    <TableCell align="right">{t('stats.failRate')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subjectGradeStats.map(s => (
                    <TableRow key={s.name} hover>
                      <TableCell>{s.name}</TableCell>
                      <TableCell align="right">{s.count}</TableCell>
                      <TableCell align="right">
                        <Chip label={s.avg.toFixed(2)} size="small" color={gradeChipColor(s.avg)} />
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          color={s.failRate > 15 ? 'error.main' : 'text.primary'}
                          fontWeight={s.failRate > 15 ? 700 : 400}
                        >
                          {fmtPct(s.failRate)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* 4c — Per-teacher grade summary */}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              {t('stats.teacherBreakdown')}
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 4 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('grades.teacher')}</TableCell>
                    <TableCell align="right">{t('stats.gradesGiven')}</TableCell>
                    <TableCell align="right">{t('stats.avgGrade')}</TableCell>
                    <TableCell align="right">{t('stats.failRate')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teacherGradeStats.map(t_ => (
                    <TableRow key={t_.name} hover>
                      <TableCell>{t_.name}</TableCell>
                      <TableCell align="right">{t_.count}</TableCell>
                      <TableCell align="right">
                        <Chip label={t_.avg.toFixed(2)} size="small" color={gradeChipColor(t_.avg)} />
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          color={t_.failRate > 15 ? 'error.main' : 'text.primary'}
                          fontWeight={t_.failRate > 15 ? 700 : 400}
                        >
                          {fmtPct(t_.failRate)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        <Divider sx={{ mb: 3 }} />

        {/* ══ SECTION 5 — Student Highlights ══ */}
        {(studentGradeStats.length > 0 || studentAbsenceStats.length > 0) && (
          <>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
              {/* Top 5 by grade */}
              {studentGradeStats.length > 0 && (
                <Box sx={{ flex: 1, minWidth: 260 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('stats.topStudents')}
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>{t('grades.student')}</TableCell>
                          <TableCell align="right">{t('stats.count')}</TableCell>
                          <TableCell align="right">{t('stats.avgGrade')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {studentGradeStats.slice(0, 5).map((s, i) => (
                          <TableRow key={s.name + i} hover>
                            <TableCell>{s.name}</TableCell>
                            <TableCell align="right">{s.count}</TableCell>
                            <TableCell align="right">
                              <Chip label={s.avg.toFixed(2)} size="small" color={gradeChipColor(s.avg)} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Top 5 most absent */}
              {studentAbsenceStats.length > 0 && (
                <Box sx={{ flex: 1, minWidth: 260 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('stats.mostAbsent')}
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>{t('absences.student')}</TableCell>
                          <TableCell align="right">{t('absences.total')}</TableCell>
                          <TableCell align="right">{t('absences.unexcusedCount')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {studentAbsenceStats.slice(0, 5).map((s, i) => (
                          <TableRow key={s.name + i} hover>
                            <TableCell>{s.name}</TableCell>
                            <TableCell align="right">{s.total}</TableCell>
                            <TableCell align="right">
                              <Chip
                                label={s.unexcused}
                                size="small"
                                color={s.unexcused > 0 ? 'error' : 'default'}
                                variant="outlined"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>

            <Divider sx={{ mb: 3 }} />
          </>
        )}

        {/* ══ SECTION 6 — Absence Statistics ══ */}
        <Typography variant="h6" sx={{ mb: 2 }}>{t('stats.absenceStats')}</Typography>

        {absences.length === 0 ? (
          <Typography color="text.secondary" sx={{ mb: 3 }}>{t('stats.noData')}</Typography>
        ) : (
          <>
            {/* Summary chips */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
              <Chip label={`${t('absences.total')}: ${absences.length}`} />
              <Chip label={`${t('absences.excusedCount')}: ${excusedAbsences}`}     color="success" variant="outlined" />
              <Chip label={`${t('absences.unexcusedCount')}: ${unexcusedAbsences}`} color="error"   variant="outlined" />
              <Chip
                label={`${t('stats.excusedRate')}: ${fmtPct((excusedAbsences / absences.length) * 100)}`}
                variant="outlined"
              />
            </Box>

            {/* 6a — Absence load by class (visual bars) */}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
              {t('stats.absenceByClass')}
            </Typography>
            <Box sx={{ mb: 3, maxWidth: 520 }}>
              {classStats
                .slice()
                .sort((a, b) => b.totalAbsences - a.totalAbsences)
                .map(cs => (
                  <RelBar
                    key={cs.id}
                    label={`${cs.name} (${cs.schoolYear})`}
                    value={cs.totalAbsences}
                    max={maxClassAbsences}
                    color="#507DBC"
                  />
                ))}
            </Box>

            {/* 6b — Subject absence breakdown */}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              {t('stats.subjectAbsenceBreakdown')}
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('stats.subject')}</TableCell>
                    <TableCell align="right">{t('absences.total')}</TableCell>
                    <TableCell align="right">{t('absences.excusedCount')}</TableCell>
                    <TableCell align="right">{t('absences.unexcusedCount')}</TableCell>
                    <TableCell align="right">{t('stats.excusedRate')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subjectAbsenceStats.map(s => (
                    <TableRow key={s.name} hover>
                      <TableCell>{s.name}</TableCell>
                      <TableCell align="right">{s.total}</TableCell>
                      <TableCell align="right">
                        <Chip label={s.excused}   size="small" color="success" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={s.unexcused} size="small" color="error"   variant="outlined" />
                      </TableCell>
                      <TableCell align="right">{fmtPct((s.excused / s.total) * 100)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

      </Box>
    </Layout>
  );
}

export default SchoolStatistics;
