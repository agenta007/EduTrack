import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Chip, CircularProgress, Paper, Tab, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tabs, Typography,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import api from '../../api/axiosInstance';
import useAuth from '../../hooks/useAuth';

const avg = arr => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null;

const fmtAvg = v => v === null ? '—' : v.toFixed(2);

const avgColor = v => {
  if (v === null) return 'default';
  if (v >= 5.5) return 'success';
  if (v >= 4.5) return 'primary';
  if (v >= 3.5) return 'warning';
  return 'error';
};

function TeacherStatistics() {
  const { teacherId } = useParams();   // present when ADMIN/HEADMASTER navigates here
  const { user } = useAuth();
  const { t } = useTranslation();

  const isOwnStats = !teacherId;       // TEACHER viewing their own stats

  const [schedules, setSchedules]       = useState([]);
  const [gradesByClass, setGradesByClass] = useState({}); // classId → GradeDto[]
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [tab, setTab]                   = useState(0);   // 0=classes 1=subjects 2=students

  useEffect(() => {
    const scheduleUrl = isOwnStats
      ? '/api/schedules/teacher/me'
      : `/api/schedules/teacher/${teacherId}`;

    api.get(scheduleUrl)
      .then(res => {
        const scheds = res.data;
        setSchedules(scheds);

        // fetch grades for every unique class
        const classIds = [...new Set(scheds.map(s => s.classId))];
        return Promise.all(
          classIds.map(id =>
            api.get(`/api/grades/class/${id}`).then(r => ({ classId: id, grades: r.data }))
          )
        );
      })
      .then(results => {
        const map = {};
        results.forEach(({ classId, grades }) => { map[classId] = grades; });
        setGradesByClass(map);
      })
      .catch(() => setError('Failed to load statistics.'))
      .finally(() => setLoading(false));
  }, [teacherId]);

  // For each schedule entry, determine which subjectId/classId this teacher handles
  // teacherSubjectsByClass[classId] = Set of subjectIds
  const teacherSubjectsByClass = useMemo(() => {
    const map = {};
    schedules.forEach(s => {
      if (!map[s.classId]) map[s.classId] = new Set();
      map[s.classId].add(s.subjectId);
    });
    return map;
  }, [schedules]);

  // subjectNames map
  const subjectNames = useMemo(() => {
    const m = {};
    schedules.forEach(s => { m[s.subjectId] = s.subjectName; });
    return m;
  }, [schedules]);

  // classNames map
  const classNames = useMemo(() => {
    const m = {};
    schedules.forEach(s => { m[s.classId] = s.className; });
    return m;
  }, [schedules]);

  // ── Per-class stats ─────────────────────────────────────────────────────────
  const classStats = useMemo(() => {
    return Object.entries(teacherSubjectsByClass).map(([classIdStr, subjectSet]) => {
      const classId = Number(classIdStr);
      const grades  = (gradesByClass[classId] || []).filter(g => subjectSet.has(g.subjectId));
      const values  = grades.map(g => parseFloat(g.value));
      const passRate = values.length
        ? ((values.filter(v => v >= 3).length / values.length) * 100).toFixed(0)
        : null;
      return {
        classId,
        className:  classNames[classId] || `Class ${classId}`,
        gradeCount: values.length,
        average:    avg(values),
        passRate,
      };
    }).sort((a, b) => a.className.localeCompare(b.className));
  }, [teacherSubjectsByClass, gradesByClass, classNames]);

  // ── Per-subject stats (across all classes this teacher teaches) ─────────────
  const subjectStats = useMemo(() => {
    const map = {};
    schedules.forEach(s => {
      if (!map[s.subjectId]) {
        map[s.subjectId] = { subjectId: s.subjectId, subjectName: s.subjectName, values: [] };
      }
    });

    Object.entries(teacherSubjectsByClass).forEach(([classIdStr, subjectSet]) => {
      const classId = Number(classIdStr);
      const grades  = gradesByClass[classId] || [];
      grades.forEach(g => {
        if (subjectSet.has(g.subjectId) && map[g.subjectId]) {
          map[g.subjectId].values.push(parseFloat(g.value));
        }
      });
    });

    return Object.values(map).map(({ subjectId, subjectName, values }) => ({
      subjectId,
      subjectName,
      gradeCount: values.length,
      average:    avg(values),
      passRate: values.length
        ? ((values.filter(v => v >= 3).length / values.length) * 100).toFixed(0)
        : null,
    })).sort((a, b) => a.subjectName.localeCompare(b.subjectName));
  }, [schedules, teacherSubjectsByClass, gradesByClass]);

  // ── Per-student stats (per class, for subjects teacher teaches) ─────────────
  const studentStats = useMemo(() => {
    const rows = [];

    Object.entries(teacherSubjectsByClass).forEach(([classIdStr, subjectSet]) => {
      const classId = Number(classIdStr);
      const grades  = (gradesByClass[classId] || []).filter(g => subjectSet.has(g.subjectId));

      // group by student
      const byStudent = {};
      grades.forEach(g => {
        const key = g.studentId;
        if (!byStudent[key]) byStudent[key] = { studentId: g.studentId, studentName: g.studentName, bySubject: {} };
        if (!byStudent[key].bySubject[g.subjectId]) byStudent[key].bySubject[g.subjectId] = [];
        byStudent[key].bySubject[g.subjectId].push(parseFloat(g.value));
      });

      Object.values(byStudent).forEach(({ studentId, studentName, bySubject }) => {
        const subjectAvgs = Object.entries(bySubject).map(([sid, vals]) => ({
          subjectId: Number(sid),
          subjectName: subjectNames[sid] || sid,
          average: avg(vals),
          gradeCount: vals.length,
        }));
        const allVals = Object.values(bySubject).flat();
        rows.push({
          classId,
          className: classNames[classId] || `Class ${classId}`,
          studentId,
          studentName,
          overall: avg(allVals),
          subjectAvgs,
        });
      });
    });

    return rows.sort((a, b) =>
      a.className.localeCompare(b.className) || a.studentName.localeCompare(b.studentName)
    );
  }, [teacherSubjectsByClass, gradesByClass, classNames, subjectNames]);

  const title = isOwnStats ? 'My Statistics' : `Teacher Statistics`;

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>{title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Averages computed only for subjects you teach, in classes you teach.
            </Typography>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
              <Tab label="By Class" />
              <Tab label="By Subject" />
              <Tab label="By Student" />
            </Tabs>

            {/* ── BY CLASS ── */}
            {tab === 0 && (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Grades given</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Average</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Pass rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {classStats.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No grade data yet.</TableCell>
                      </TableRow>
                    ) : classStats.map(row => (
                      <TableRow key={row.classId} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{row.className}</TableCell>
                        <TableCell align="center">{row.gradeCount}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={fmtAvg(row.average)}
                            size="small"
                            color={avgColor(row.average)}
                            variant={row.average === null ? 'outlined' : 'filled'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {row.passRate !== null ? `${row.passRate}%` : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* ── BY SUBJECT ── */}
            {tab === 1 && (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Grades given</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Average</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Pass rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {subjectStats.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No grade data yet.</TableCell>
                      </TableRow>
                    ) : subjectStats.map(row => (
                      <TableRow key={row.subjectId} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{row.subjectName}</TableCell>
                        <TableCell align="center">{row.gradeCount}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={fmtAvg(row.average)}
                            size="small"
                            color={avgColor(row.average)}
                            variant={row.average === null ? 'outlined' : 'filled'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {row.passRate !== null ? `${row.passRate}%` : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* ── BY STUDENT ── */}
            {tab === 2 && (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Overall avg</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Per subject</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {studentStats.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No grade data yet.</TableCell>
                      </TableRow>
                    ) : studentStats.map(row => (
                      <TableRow key={`${row.classId}-${row.studentId}`} hover>
                        <TableCell>{row.className}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{row.studentName}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={fmtAvg(row.overall)}
                            size="small"
                            color={avgColor(row.overall)}
                            variant={row.overall === null ? 'outlined' : 'filled'}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {row.subjectAvgs.map(sa => (
                              <Chip
                                key={sa.subjectId}
                                label={`${sa.subjectName}: ${fmtAvg(sa.average)}`}
                                size="small"
                                color={avgColor(sa.average)}
                                variant="outlined"
                                sx={{ fontSize: '0.72rem' }}
                              />
                            ))}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Box>
    </Layout>
  );
}

export default TeacherStatistics;
