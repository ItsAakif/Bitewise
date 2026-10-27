// Reference intakes for Indians, from ICMR-NIN "Nutrient Requirements and
// Recommended Dietary Allowances for Indians" (2020). These differ sharply from
// the American DRI the app previously inherited: calcium is 1000 mg rather than
// 800, and iron for women is 29 mg rather than 18.
//
// Reference values are population figures, not a prescription for one person.

export const RDA_SOURCE = 'ICMR-NIN RDA/EAR 2020 (India)';

const ADULT_MALE = {
  fiber: 30,
  sugar: 25,
  sodium: 2000,
  calcium: 1000,
  iron: 19,
  zinc: 17,
  magnesium: 440,
  potassium: 3500,
  vitaminC: 80,
  vitaminB12: 2.2,
  folate: 300,
  vitaminD: 15,
};

const ADULT_FEMALE = {
  fiber: 25,
  sugar: 25,
  sodium: 2000,
  calcium: 1000,
  iron: 29,
  zinc: 13,
  magnesium: 370,
  potassium: 3500,
  vitaminC: 65,
  vitaminB12: 2.2,
  folate: 300,
  vitaminD: 15,
};

export const RDA_GROUPS = [
  { id: 'child', label: 'Child (4–8)', minAge: 4, maxAge: 8, scale: 0.6 },
  { id: 'preadolescent', label: 'Child (9–13)', minAge: 9, maxAge: 13, scale: 0.8 },
  { id: 'adolescent', label: 'Adolescent (14–17)', minAge: 14, maxAge: 17, scale: 0.95 },
  { id: 'adult', label: 'Adult (18–59)', minAge: 18, maxAge: 59, scale: 1 },
  { id: 'older', label: 'Older adult (60+)', minAge: 60, maxAge: 200, scale: 1 },
];

export function groupFor(age) {
  const n = Number(age);
  if (!Number.isFinite(n) || n <= 0) return RDA_GROUPS[3]; // adult default
  return RDA_GROUPS.find((g) => n >= g.minAge && n <= g.maxAge) || RDA_GROUPS[3];
}

const roundTo = (value, step) => Math.round(value / step) * step;

/**
 * @param {{ sex?: 'male'|'female'|null, age?: number|null,
 *           pregnant?: boolean, lactating?: boolean }} profile
 */
export function rdaFor({ sex, age, pregnant = false, lactating = false } = {}) {
  const female = sex === 'female';
  const base = { ...(female ? ADULT_FEMALE : ADULT_MALE) };
  const group = groupFor(age);

  // Children scale down, except iron and calcium which stay near adult values
  // because Indian childhood deficiency is in exactly those two.
  if (group.scale !== 1) {
    for (const key of Object.keys(base)) {
      if (key === 'iron' || key === 'calcium') continue;
      base[key] = roundTo(base[key] * group.scale, base[key] >= 100 ? 50 : 1);
    }
    if (group.id === 'adolescent' && female) base.iron = 27;
    if (group.id === 'adolescent' && !female) base.iron = 21;
  }

  if (pregnant) {
    base.iron = 27;
    base.folate = 500;
    base.calcium = 1200;
  }
  if (lactating) {
    base.iron = 21;
    base.folate = 400;
    base.calcium = 1200;
    base.vitaminC = 80;
  }

  return base;
}

/** A short sentence the UI can show next to the numbers. */
export function rdaDescription(profile = {}) {
  const group = groupFor(profile.age);
  const sexLabel = profile.sex === 'female' ? 'women' : profile.sex === 'male' ? 'men' : 'adults';
  const extra = profile.pregnant ? ', pregnancy' : profile.lactating ? ', lactation' : '';
  return `${group.label} · ${sexLabel}${extra} · ${RDA_SOURCE}`;
}
