// The eating window is already implied by the food log, so it is derived rather
// than stored. No timer to start, no second source of truth to drift.
//
// This is not a fasting protocol tracker and must not present itself as advice:
// fasting is unsuitable for pregnancy, type 1 diabetes and anyone with a history
// of disordered eating.

const MINUTES_PER_DAY = 24 * 60;

export function fastingWindow(meals = []) {
  const times = meals
    .map((meal) => (meal?.time ? new Date(meal.time).getTime() : NaN))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  if (times.length < 2) return null;

  const first = times[0];
  const last = times[times.length - 1];
  const eatingMinutes = Math.max(0, Math.min(MINUTES_PER_DAY, Math.round((last - first) / 60000)));

  return {
    eatingMinutes,
    fastingMinutes: MINUTES_PER_DAY - eatingMinutes,
    firstAt: new Date(first).toISOString(),
    lastAt: new Date(last).toISOString(),
  };
}

export function formatDuration(minutes) {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
