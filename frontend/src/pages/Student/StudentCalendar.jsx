import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Chip, CircularProgress, Divider, IconButton,
  Paper, Tooltip, Typography,
} from '@mui/material';
import ChevronLeftIcon  from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon        from '@mui/icons-material/Today';
import Layout from '../../components/Layout';
import api    from '../../api/axiosInstance';

// ── Event-type config ────────────────────────────────────────────────────────
const EVENT_META = {
  TEST:    { label: 'Test',    color: 'error',   dot: '#f44336' },
  HOLIDAY: { label: 'Holiday', color: 'success',  dot: '#4caf50' },
  MEETING: { label: 'Meeting', color: 'primary',  dot: '#2196f3' },
  OTHER:   { label: 'Other',   color: 'default',  dot: '#9e9e9e' },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const DAYS   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

/** Returns the Monday-anchored day-of-week index (0=Mon … 6=Sun). */
function dowIndex(date) {
  return (date.getDay() + 6) % 7;
}

/** yyyy-MM-dd string → local Date (avoids UTC shift). */
function parseLocalDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── Main component ───────────────────────────────────────────────────────────
export default function StudentCalendar() {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [viewDate, setViewDate] = useState(today()); // first day of displayed month
  const [selected, setSelected] = useState(null);    // Date | null

  // Normalise to 1st of month
  const monthStart = useMemo(() => {
    const d = new Date(viewDate);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [viewDate]);

  useEffect(() => {
    setLoading(true);
    api.get('/api/events/student/me')
      .then(res => setEvents(res.data))
      .catch(() => setError('Failed to load calendar events.'))
      .finally(() => setLoading(false));
  }, []);

  // Build a map: dateKey → SchoolEventDto[]
  const eventMap = useMemo(() => {
    const m = {};
    events.forEach(ev => {
      const k = ev.date;
      if (!m[k]) m[k] = [];
      m[k].push(ev);
    });
    return m;
  }, [events]);

  // Build calendar grid cells
  const cells = useMemo(() => {
    const year  = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDow    = dowIndex(monthStart);         // 0-6, Mon-based
    const totalCells  = Math.ceil((startDow + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, i) => {
      const dayOffset = i - startDow;
      if (dayOffset < 0 || dayOffset >= daysInMonth) return null;
      const d = new Date(year, month, dayOffset + 1);
      return d;
    });
  }, [monthStart]);

  const prevMonth = () =>
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () =>
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goToday   = () => {
    setViewDate(today());
    setSelected(today());
  };

  const todayKey    = toKey(today());
  const selectedKey = selected ? toKey(selected) : null;
  const selectedEvents = selectedKey ? (eventMap[selectedKey] || []) : [];

  // Upcoming events (next 30 days from today, sorted)
  const upcoming = useMemo(() => {
    const now  = today();
    const ceil = new Date(now); ceil.setDate(ceil.getDate() + 30);
    return events
      .filter(ev => {
        const d = parseLocalDate(ev.date);
        return d >= now && d <= ceil;
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 8);
  }, [events]);

  return (
    <Layout>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
          My Calendar
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>

            {/* ── Calendar grid ─────────────────────────────────────────── */}
            <Box sx={{ flex: '1 1 0', minWidth: 0 }}>
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>

                {/* Month navigation header */}
                <Box sx={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 2, py: 1.5,
                  borderBottom: 1, borderColor: 'divider',
                  background: t => t.palette.mode === 'dark'
                    ? t.palette.background.paper
                    : t.palette.grey[50],
                }}>
                  <IconButton size="small" onClick={prevMonth} aria-label="Previous month">
                    <ChevronLeftIcon />
                  </IconButton>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, minWidth: 180, textAlign: 'center' }}>
                      {MONTHS[monthStart.getMonth()]} {monthStart.getFullYear()}
                    </Typography>
                    <Tooltip title="Go to today">
                      <IconButton size="small" onClick={goToday} aria-label="Today">
                        <TodayIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <IconButton size="small" onClick={nextMonth} aria-label="Next month">
                    <ChevronRightIcon />
                  </IconButton>
                </Box>

                {/* Day-of-week headers */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  {DAYS.map(d => (
                    <Box key={d} sx={{
                      py: 0.75, textAlign: 'center',
                      borderBottom: 1, borderColor: 'divider',
                    }}>
                      <Typography variant="caption" sx={{
                        fontWeight: 600,
                        color: d === 'Sat' || d === 'Sun' ? 'error.main' : 'text.secondary',
                        fontSize: '0.72rem',
                        letterSpacing: '.04em',
                      }}>
                        {d}
                      </Typography>
                    </Box>
                  ))}

                  {/* Day cells */}
                  {cells.map((date, idx) => {
                    if (!date) {
                      return (
                        <Box key={`empty-${idx}`} sx={{
                          minHeight: 72,
                          borderRight: idx % 7 !== 6 ? 1 : 0,
                          borderBottom: 1,
                          borderColor: 'divider',
                          bgcolor: t => t.palette.mode === 'dark'
                            ? 'rgba(0,0,0,.18)' : 'rgba(0,0,0,.03)',
                        }} />
                      );
                    }

                    const key    = toKey(date);
                    const dayEvs = eventMap[key] || [];
                    const isToday    = key === todayKey;
                    const isSelected = key === selectedKey;
                    const isWeekend  = date.getDay() === 0 || date.getDay() === 6;

                    return (
                      <Box
                        key={key}
                        onClick={() => setSelected(date)}
                        sx={{
                          minHeight: 72,
                          p: 0.75,
                          cursor: 'pointer',
                          position: 'relative',
                          borderRight: idx % 7 !== 6 ? 1 : 0,
                          borderBottom: 1,
                          borderColor: 'divider',
                          bgcolor: isSelected
                            ? t => t.palette.primary.main + '18'
                            : isToday
                              ? t => t.palette.primary.main + '0c'
                              : 'transparent',
                          '&:hover': {
                            bgcolor: t => t.palette.action.hover,
                          },
                          transition: 'background .15s',
                        }}
                      >
                        {/* Day number */}
                        <Box sx={{
                          width: 26, height: 26,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: '50%',
                          bgcolor: isToday ? 'primary.main' : 'transparent',
                          mb: 0.5,
                        }}>
                          <Typography variant="caption" sx={{
                            fontWeight: isToday || isSelected ? 700 : 400,
                            color: isToday
                              ? 'primary.contrastText'
                              : isWeekend
                                ? 'error.main'
                                : 'text.primary',
                            fontSize: '0.78rem',
                            lineHeight: 1,
                          }}>
                            {date.getDate()}
                          </Typography>
                        </Box>

                        {/* Event dots — show up to 3 then "+N" */}
                        {dayEvs.length > 0 && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                            {dayEvs.slice(0, 3).map(ev => (
                              <Tooltip key={ev.id} title={ev.title} placement="top" arrow>
                                <Box sx={{
                                  width: 6, height: 6,
                                  borderRadius: '50%',
                                  bgcolor: EVENT_META[ev.type]?.dot ?? '#9e9e9e',
                                  flexShrink: 0,
                                }} />
                              </Tooltip>
                            ))}
                            {dayEvs.length > 3 && (
                              <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', lineHeight: 1, mt: '1px' }}>
                                +{dayEvs.length - 3}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Paper>

              {/* Legend */}
              <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
                {Object.entries(EVENT_META).map(([type, meta]) => (
                  <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: meta.dot }} />
                    <Typography variant="caption" color="text.secondary">{meta.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* ── Right panel ───────────────────────────────────────────── */}
            <Box sx={{ width: { xs: '100%', md: 280 }, flexShrink: 0 }}>

              {/* Selected day events */}
              <Paper variant="outlined" sx={{ borderRadius: 2, mb: 2, overflow: 'hidden' }}>
                <Box sx={{
                  px: 2, py: 1.5,
                  borderBottom: 1, borderColor: 'divider',
                  bgcolor: t => t.palette.mode === 'dark'
                    ? t.palette.background.paper
                    : t.palette.grey[50],
                }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {selected
                      ? selected.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
                      : 'Select a day'}
                  </Typography>
                </Box>

                <Box sx={{ p: 1.5 }}>
                  {!selected ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                      Click on a day to see its events.
                    </Typography>
                  ) : selectedEvents.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                      No events on this day.
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {selectedEvents.map(ev => (
                        <EventCard key={ev.id} ev={ev} />
                      ))}
                    </Box>
                  )}
                </Box>
              </Paper>

              {/* Upcoming events */}
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{
                  px: 2, py: 1.5,
                  borderBottom: 1, borderColor: 'divider',
                  bgcolor: t => t.palette.mode === 'dark'
                    ? t.palette.background.paper
                    : t.palette.grey[50],
                }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Upcoming (30 days)
                  </Typography>
                </Box>

                <Box sx={{ p: 1.5 }}>
                  {upcoming.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                      No upcoming events.
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {upcoming.map((ev, i) => (
                        <React.Fragment key={ev.id}>
                          {i > 0 && <Divider sx={{ my: 0.5 }} />}
                          <Box
                            sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', py: 0.5, cursor: 'pointer', borderRadius: 1, px: 0.5, '&:hover': { bgcolor: 'action.hover' } }}
                            onClick={() => {
                              const d = parseLocalDate(ev.date);
                              setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
                              setSelected(d);
                            }}
                          >
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: EVENT_META[ev.type]?.dot, mt: '5px', flexShrink: 0 }} />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {parseLocalDate(ev.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
                                {ev.title}
                              </Typography>
                            </Box>
                          </Box>
                        </React.Fragment>
                      ))}
                    </Box>
                  )}
                </Box>
              </Paper>
            </Box>

          </Box>
        )}
      </Box>
    </Layout>
  );
}

// ── EventCard sub-component ──────────────────────────────────────────────────
function EventCard({ ev }) {
  const meta = EVENT_META[ev.type] ?? EVENT_META.OTHER;
  return (
    <Box sx={{
      p: 1.25,
      borderRadius: 1.5,
      border: 1,
      borderColor: 'divider',
      borderLeft: 3,
      borderLeftColor: meta.dot,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
        <Chip label={meta.label} color={meta.color} size="small" sx={{ fontSize: '0.68rem', height: 18 }} />
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>{ev.title}</Typography>
      {ev.description && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
          {ev.description}
        </Typography>
      )}
      {(ev.className || ev.schoolName) && (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.25 }}>
          {ev.className ?? ev.schoolName}
        </Typography>
      )}
    </Box>
  );
}
