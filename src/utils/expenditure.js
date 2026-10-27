// Adaptive energy expenditure. Not a formula from a table — the arithmetic of
// what actually happened: intake (food logged) against weight change.
//
// This is the MacroFactor idea reduced to what a local app can honestly do. The
// hard part is not the maths, it is refusing to show a number before there is
// enough data to mean anything.

const KCAL_PER_KG = 7700;
const MIN_DAYS = 10;
const MIN_DAYS_LOW = 14;
const MIN_DAYS_MEDIUM = 21;

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/** Least-squares slope of y over equally spaced x. */
function slope(points) {
  const n = points.length;
  if (n < 2) return 0;
  const meanX = points.reduce((sum, p) => sum + p.x, 0) / n;
  const meanY = points.reduce((sum, p) => sum + p.y, 0) / n;
  let numerator = 0;
  let denominator = 0;
  for (const point of points) {
    numerator += (point.x - meanX) * (point.y - meanY);
    denominator += (point.x - meanX) ** 2;
  }
  if (denominator === 0) return 0;
  return numerator / denominator;
}

function toDayIndex(iso, origin) {
  const a = new Date(`${iso}T00:00:00`).getTime();
  const b = new Date(`${origin}T00:00:00`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((a - b) / 86400000);
}

/**
 * @param {{ history?: object[], dailyLog?: object|null,
 *           weights?: { date: string, value: number }[] }} input
 */
export function estimateExpenditure({ history = [], dailyLog = null, weights = [] } = {}) {
  const intakeByDate = new Map();
  const allDays = [...history, ...(dailyLog && dailyLog.date ? [dailyLog] : [])];

  for (const day of allDays) {
    if (!day?.date) continue;
    intakeByDate.set(day.date, num(day.totals?.calories));
  }

  const weightByDate = new Map();
  for (const entry of weights) {
    if (entry?.date && Number.isFinite(Number(entry.value))) {
      weightByDate.set(entry.date, Number(entry.value));
    }
  }

  const pairs = [];
  for (const [date, calories] of intakeByDate) {
    if (!weightByDate.has(date) || calories <= 0) continue;
    pairs.push({ date, calories, weight: weightByDate.get(date) });
  }
  pairs.sort((a, b) => a.date.localeCompare(b.date));

  const window = pairs.slice(-28);
  const days = window.length;

  if (days < MIN_DAYS) {
    return {
      tdee: null,
      confidence: 'none',
      days,
      slopeKgPerWeek: null,
      intakeAvg: days ? Math.round(window.reduce((s, p) => s + p.calories, 0) / days) : 0,
      weightChangeKg: null,
      message: `Needs ${MIN_DAYS} days with both food and weight logged. You have ${days}.`,
    };
  }

  const origin = window[0].date;
  const points = window
    .map((p) => ({ x: toDayIndex(p.date, origin), y: p.weight }))
    .filter((p) => p.x != null);

  const kgPerDay = slope(points);
  const intakeAvg = window.reduce((sum, p) => sum + p.calories, 0) / days;
  const raw = intakeAvg - kgPerDay * KCAL_PER_KG;
  const tdee = Math.round(Math.max(1200, Math.min(6000, raw)));

  const confidence = days >= MIN_DAYS_MEDIUM ? 'high' : days >= MIN_DAYS_LOW ? 'medium' : 'low';
  const weightChangeKg = Math.round((kgPerDay * days) * 10) / 10;

  const direction =
    kgPerDay < -0.0005 ? 'losing' : kgPerDay > 0.0005 ? 'gaining' : 'holding steady';

  return {
    tdee,
    confidence,
    days,
    slopeKgPerWeek: Math.round(kgPerDay * 7 * 100) / 100,
    intakeAvg: Math.round(intakeAvg),
    weightChangeKg,
    message: `From ${days} days of logs: you averaged ${Math.round(
      intakeAvg
    )} kcal and were ${direction} (${weightChangeKg} kg over the window).`,
  };
}

export const CONFIDENCE_COPY = {
  none: 'Not enough data',
  low: 'Early estimate — treat as a rough guide',
  medium: 'Reasonable estimate',
  high: 'Well supported by your data',
};
