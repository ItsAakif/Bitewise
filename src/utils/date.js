// Local-date helpers. Everything here works in the device's local day: a meal
// eaten at 00:10 belongs to that day, not to the UTC day before it.

const pad = (n) => String(n).padStart(2, '0');

/** Date -> 'YYYY-MM-DD' using local parts. */
export function toISODate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function parseISODate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(iso, n) {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** Monday-based week start. */
export function startOfWeekISO(iso) {
  const d = parseISODate(iso);
  const mondayOffset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - mondayOffset);
  return toISODate(d);
}

export function daysBetween(fromISO, toISOValue) {
  const a = parseISODate(fromISO).getTime();
  const b = parseISODate(toISOValue).getTime();
  return Math.round((b - a) / 86400000);
}

export function formatDayLabel(iso) {
  return parseISODate(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatLongDate(iso) {
  return parseISODate(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function weekdayInitial(iso) {
  return parseISODate(iso).toLocaleDateString(undefined, { weekday: 'narrow' });
}

export function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function formatClock(isoTimestamp) {
  const d = new Date(isoTimestamp);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/** 'HH:MM' -> minutes since midnight, or null when malformed. */
export function clockToMinutes(clock) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(clock || ''));
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function isToday(iso) {
  return iso === todayISO();
}
