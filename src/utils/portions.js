// Portions are SI: a serving declares a weight, and a log entry is a multiple of
// it. No katori, no bowl, no "1 plate" — the gram figure is the measurement.

/** Pulls the weight out of a serving label such as "150 g" or "240 ml". */
export function gramsFromServing(serving) {
  const match = /(\d+(?:\.\d+)?)\s*(g|ml)\b/i.exec(String(serving || ''));
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * @param {{ food: object, count?: number, grams?: number }} input
 * @returns {{ grams: number|null, quantity: number, label: string, resolved: boolean }}
 */
export function resolvePortion({ food, count = 1, grams } = {}) {
  const base = gramsFromServing(food?.serving);
  const n = Number(count) > 0 ? Number(count) : 1;

  if (grams != null) {
    const g = Math.max(0, Number(grams) || 0);
    return {
      grams: Math.round(g),
      quantity: base ? g / base : n,
      label: `${Math.round(g)} g`,
      resolved: Boolean(base),
    };
  }

  const total = base ? base * n : null;
  return {
    grams: total == null ? null : Math.round(total),
    quantity: n,
    label: total == null ? `${n} × serving` : `${Math.round(total)} g`,
    resolved: base != null,
  };
}
