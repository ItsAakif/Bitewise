// Personal insights: what the user's own records actually show.
//
// Every insight states its own arithmetic — how many days, how many were short,
// against which target — because "you are low on iron" without the working is
// just noise. Low recorded intake is not a deficiency: it means the log is short,
// the food was not logged, or the catalogue lacks the nutrient. The screen says so.
//
// Deliberately rule-based. A model could phrase these better, but a model cannot
// be trusted to invent the numbers, and these numbers are the whole point.

import { addDays, todayISO } from './date';
import { MICRO_GOALS, MICRO_LABELS, MICRO_UNITS } from '../data/micros';

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

function collectDays(history, dailyLog, windowDays) {
  const cutoff = addDays(todayISO(), -(windowDays - 1));
  const byDate = new Map();

  for (const day of history || []) {
    if (day?.date && day.date >= cutoff) byDate.set(day.date, day);
  }
  if (dailyLog?.date && dailyLog.date >= cutoff) byDate.set(dailyLog.date, dailyLog);

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Catalogue foods richest in a nutrient, per serving. */
function bestSources(foods, key, limit = 3) {
  return (foods || [])
    .filter((food) => num(food.micros?.[key]) > 0)
    .sort((a, b) => num(b.micros[key]) - num(a.micros[key]))
    .slice(0, limit)
    .map((food) => ({
      id: food.id,
      name: food.name,
      amount: num(food.micros[key]),
      unit: MICRO_UNITS[key],
    }));
}

function weekdayOf(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  const day = new Date(y, (m || 1) - 1, d || 1).getDay();
  return day === 0 || day === 6 ? 'weekend' : 'weekday';
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * @param {{ history?: object[], dailyLog?: object|null, targets?: object,
 *           foods?: object[], windowDays?: number }} input
 */
export function buildInsights({ history = [], dailyLog = null, targets = {}, foods = [], windowDays = 21 } = {}) {
  const days = collectDays(history, dailyLog, windowDays);
  const logged = days.filter((day) => (day.totals?.calories || 0) > 0);

  const base = {
    windowDays,
    daysWithRecords: logged.length,
    insights: [],
  };

  if (logged.length < 3) {
    base.insights.push({
      id: 'thin-records',
      tone: 'info',
      title: 'Not enough records yet',
      detail: `Only ${logged.length} day${logged.length === 1 ? '' : 's'} with food logged in the last ${windowDays}. Insights need a few days before they mean anything.`,
      evidence: `Looked at ${windowDays} days, ${logged.length} had calories logged.`,
    });
    return base;
  }

  // ── recurring nutrient gaps ───────────────────────────────────────────────
  const microTargets = targets?.micros || {};
  const gaps = [];

  for (const key of MICRO_GOALS) {
    const target = num(microTargets[key]);
    if (target <= 0) continue;

    const short = logged.filter((day) => num(day.micros?.[key]) < target * 0.7);
    const share = short.length / logged.length;
    if (share < 0.6 || short.length < 4) continue;

    gaps.push({ key, target, shortDays: short.length, share });
  }

  gaps.sort((a, b) => b.share - a.share);

  for (const gap of gaps.slice(0, 3)) {
    const sources = bestSources(foods, gap.key);
    base.insights.push({
      id: `gap-${gap.key}`,
      tone: 'watch',
      title: `${MICRO_LABELS[gap.key]} is short most days`,
      detail: `You recorded under 70 % of your ${Math.round(gap.target)} ${MICRO_UNITS[gap.key]} target on ${gap.shortDays} of ${logged.length} logged days.`,
      evidence: `${gap.shortDays}/${logged.length} days below ${Math.round(gap.target * 0.7)} ${MICRO_UNITS[gap.key]} (70 % of the ${Math.round(gap.target)} ${MICRO_UNITS[gap.key]} target).`,
      suggestion: sources.length
        ? { label: 'Richest foods you have', foods: sources }
        : null,
    });
  }

  // ── protein consistency ───────────────────────────────────────────────────
  const proteinTarget = num(targets?.protein);
  if (proteinTarget > 0) {
    const short = logged.filter((day) => num(day.totals?.protein) < proteinTarget * 0.8);
    const share = short.length / logged.length;
    if (share >= 0.5) {
      base.insights.push({
        id: 'protein-consistency',
        tone: 'watch',
        title: 'Protein lands short more often than not',
        detail: `${short.length} of ${logged.length} logged days were under 80 % of your ${Math.round(proteinTarget)} g target.`,
        evidence: `Average ${Math.round(average(logged.map((day) => num(day.totals?.protein))))} g against a ${Math.round(proteinTarget)} g target.`,
      });
    }
  }

  // ── weekday vs weekend ────────────────────────────────────────────────────
  const weekend = logged.filter((day) => weekdayOf(day.date) === 'weekend').map((day) => num(day.totals?.calories));
  const weekday = logged.filter((day) => weekdayOf(day.date) === 'weekday').map((day) => num(day.totals?.calories));

  if (weekend.length >= 2 && weekday.length >= 3) {
    const weekendAvg = average(weekend);
    const weekdayAvg = average(weekday);
    const difference = weekendAvg - weekdayAvg;
    const relative = weekdayAvg > 0 ? Math.abs(difference) / weekdayAvg : 0;

    if (relative >= 0.15) {
      base.insights.push({
        id: 'weekday-weekend',
        tone: 'info',
        title: difference > 0 ? 'Weekends run higher' : 'Weekends run lower',
        detail: `Weekend days average ${Math.round(weekendAvg)} kcal against ${Math.round(weekdayAvg)} on weekdays.`,
        evidence: `${weekend.length} weekend and ${weekday.length} weekday records in the window.`,
      });
    }
  }

  // ── logging consistency ───────────────────────────────────────────────────
  if (logged.length / windowDays < 0.6) {
    base.insights.push({
      id: 'thin-logging',
      tone: 'info',
      title: 'Records are patchy',
      detail: `You logged ${logged.length} of the last ${windowDays} days. The more days recorded, the more these observations can be trusted.`,
      evidence: `${logged.length}/${windowDays} days with calories logged.`,
    });
  }

  // ── one positive note ─────────────────────────────────────────────────────
  const met = [];
  for (const key of MICRO_GOALS) {
    const target = num(microTargets[key]);
    if (target <= 0) continue;
    const good = logged.filter((day) => num(day.micros?.[key]) >= target * 0.8);
    if (good.length / logged.length >= 0.7) met.push({ key, days: good.length });
  }
  if (met.length) {
    const top = met[0];
    base.insights.push({
      id: `met-${top.key}`,
      tone: 'good',
      title: `${MICRO_LABELS[top.key]} is consistently met`,
      detail: `You reached 80 % of your ${MICRO_LABELS[top.key].toLowerCase()} target on ${top.days} of ${logged.length} logged days.`,
      evidence: `${top.days}/${logged.length} days at or above 80 % of target.`,
    });
  }

  if (!base.insights.length) {
    base.insights.push({
      id: 'nothing-stands-out',
      tone: 'good',
      title: 'Nothing stands out',
      detail: 'No recurring gap across the tracked nutrients in this window. That is the absence of a pattern, not proof that everything is fine.',
      evidence: `${logged.length}/${windowDays} logged days examined.`,
    });
  }

  return base;
}

export const INSIGHTS_CAVEAT =
  'These come from what you recorded. A short log, a food without nutrient data, or a day you did not finish logging all look like a gap. They are not a diagnosis.';
