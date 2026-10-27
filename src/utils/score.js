// A single number for the day, with its own breakdown. The parts always sum to
// the score, so tapping it can explain exactly where the points came from — a
// score nobody can interrogate is worse than no score.

const WEIGHTS = { calories: 30, protein: 20, fiber: 15, micros: 15, water: 10, logging: 10 };

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** Full marks within 10 % of target, zero at 40 % off, linear between. */
function caloriePoints(consumed, target) {
  if (target <= 0) return { points: 0, detail: 'No calorie target set' };
  if (consumed <= 0) return { points: 0, detail: 'Nothing logged yet' };
  const deviation = Math.abs(consumed - target) / target;
  if (deviation <= 0.1) return { points: WEIGHTS.calories, detail: 'Within 10 % of target' };
  if (deviation >= 0.4) return { points: 0, detail: 'More than 40 % off target' };
  const scale = 1 - (deviation - 0.1) / 0.3;
  return {
    points: Math.round(WEIGHTS.calories * scale),
    detail: `${Math.round(deviation * 100)} % off target`,
  };
}

function targetPoints(value, target, max, label, unit = 'g') {
  if (!target || target <= 0) return { points: 0, detail: `No ${label.toLowerCase()} target set` };
  const ratio = clamp(num(value) / target, 0, 1);
  return {
    points: Math.round(max * ratio),
    detail: `${Math.round(num(value))} of ${Math.round(target)} ${unit}`,
  };
}

/**
 * @param {{ totals: object, micros: object, targets: object,
 *           water: number, waterTarget: number, mealCount: number }} input
 */
export function healthScore({ totals, micros, targets, water = 0, waterTarget = 0, mealCount = 0 }) {
  const calorieTarget = num(targets?.calories);
  const calorie = caloriePoints(num(totals?.calories), calorieTarget);

  const protein = targetPoints(totals?.protein, targets?.protein, WEIGHTS.protein, 'Protein');

  const fiberTarget = num(targets?.micros?.fiber);
  const fiber = targetPoints(micros?.fiber, fiberTarget, WEIGHTS.fiber, 'Fibre');

  // Micronutrients: share of the tracked goals that reached 80 % of target.
  const microTargets = targets?.micros || {};
  const trackedGoals = ['calcium', 'iron', 'zinc', 'magnesium', 'potassium', 'vitaminC', 'vitaminB12', 'folate', 'vitaminD'].filter(
    (key) => num(microTargets[key]) > 0
  );
  const met = trackedGoals.filter((key) => num(micros?.[key]) >= num(microTargets[key]) * 0.8).length;
  const microPoints = trackedGoals.length
    ? Math.round((met / trackedGoals.length) * WEIGHTS.micros)
    : 0;

  const waterPart = targetPoints(water, waterTarget, WEIGHTS.water, 'Water', 'ml');

  const loggingPoints = mealCount >= 3 ? 10 : mealCount === 2 ? 7 : mealCount === 1 ? 4 : 0;

  const parts = [
    { key: 'calories', label: 'Calories', max: WEIGHTS.calories, points: calorie.points, detail: calorie.detail },
    { key: 'protein', label: 'Protein', max: WEIGHTS.protein, points: protein.points, detail: protein.detail },
    { key: 'fiber', label: 'Fibre', max: WEIGHTS.fiber, points: fiber.points, detail: fiber.detail },
    {
      key: 'micros',
      label: 'Micronutrients',
      max: WEIGHTS.micros,
      points: microPoints,
      detail: trackedGoals.length
        ? `${met} of ${trackedGoals.length} nutrients at 80 % or more`
        : 'No micronutrient targets set',
    },
    { key: 'water', label: 'Water', max: WEIGHTS.water, points: waterPart.points, detail: waterPart.detail },
    {
      key: 'logging',
      label: 'Logging',
      max: WEIGHTS.logging,
      points: loggingPoints,
      detail: `${mealCount} ${mealCount === 1 ? 'meal' : 'meals'} logged`,
    },
  ];

  const score = parts.reduce((sum, part) => sum + part.points, 0);
  const band = score >= 80 ? 'strong' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor';

  return { score, band, parts };
}

export const SCORE_BAND_LABELS = {
  strong: 'Strong day',
  good: 'Good day',
  fair: 'Fair day',
  poor: 'Thin day',
};
