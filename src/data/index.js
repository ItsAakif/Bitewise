import { FOODS } from './foods';
import { INDIAN_DISHES } from './indianDishes';

export { FOODS, FOOD_CATEGORIES, DIET_TAGS } from './foods';
export { INDIAN_DISHES, INDIAN_DISH_TAGS } from './indianDishes';
export { RECIPES, RECIPE_TAGS } from './recipes';
export { WORKOUTS, WORKOUT_TYPES } from './workouts';
export { CHALLENGES } from './challenges';
export { FAQ, FAQ_CATEGORIES } from './faq';
export { TERMS, PRIVACY } from './legal';
export {
  MICRO_KEYS,
  MICRO_UNITS,
  MICRO_LABELS,
  MICRO_GOALS,
  MICRO_LIMITS,
  zeros,
  addMicros,
  sumMicros,
  scaleMicros,
  hasMicros,
} from './micros';
export { RDA_GROUPS, RDA_SOURCE, rdaFor, rdaDescription, groupFor } from './indianRda';

// Everything loggable, in one list: raw ingredients first, then finished Indian
// dishes. Search and the diary read this; the two sources stay separate files so
// the dishes can be replaced wholesale if their licensing ever changes.
export const ALL_FOODS = [...FOODS, ...INDIAN_DISHES];
