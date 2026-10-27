/* Behavioural smoke test for the pure layer: slices, reducers and utilities.
 * Runs in plain Node by compiling the ESM sources to CJS on the fly, so it
 * exercises the real reducers rather than a copy of them.
 *
 *   npm run smoke
 */
process.env.TZ = 'Pacific/Kiritimati'; // UTC+14: catches UTC-vs-local date bugs

const fs = require('fs');
const path = require('path');
const Module = require('module');
const babel = require('@babel/core');

const ROOT = path.resolve(__dirname, '..');

const originalJs = Module._extensions['.js'];
Module._extensions['.js'] = function compile(module, filename) {
  if (filename.includes(`${path.sep}node_modules${path.sep}`)) {
    return originalJs(module, filename);
  }
  const source = fs.readFileSync(filename, 'utf8');
  const { code } = babel.transformSync(source, {
    filename,
    babelrc: false,
    configFile: false,
    plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')],
  });
  return module._compile(code, filename);
};

const req = (rel) => require(path.join(ROOT, rel));

let passed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ok    ${name}`);
  } catch (error) {
    failures.push({ name, message: error.message });
    console.log(`  FAIL  ${name}\n        ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function equal(actual, expected, message) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${message || 'values differ'}\n        expected ${e}\n        actual   ${a}`);
}

// ── utilities ────────────────────────────────────────────────────────────────
console.log('\ndate');
const date = req('src/utils/date');
check('todayISO uses local date parts, not UTC', () => {
  const now = new Date();
  const local = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
  assert(date.todayISO() === local, `expected ${local}, got ${date.todayISO()}`);
});
check('addDays crosses month and year boundaries', () => {
  assert(date.addDays('2026-01-31', 1) === '2026-02-01', 'Jan 31 + 1');
  assert(date.addDays('2026-12-31', 1) === '2027-01-01', 'Dec 31 + 1');
  assert(date.addDays('2026-03-01', -1) === '2026-02-28', 'Mar 1 - 1');
});
check('startOfWeekISO returns a Monday', () => {
  const monday = date.startOfWeekISO('2026-10-28');
  assert(monday === '2026-10-26', `expected 2026-10-26, got ${monday}`);
});
check('clockToMinutes rejects malformed input', () => {
  assert(date.clockToMinutes('08:00') === 480, '08:00');
  assert(date.clockToMinutes('24:00') === null, '24:00 must be null');
  assert(date.clockToMinutes('8:00') === null, '8:00 must be null');
});

console.log('\nnutrition maths');
const nutri = req('src/utils/nutrition');
check('percent clamps and never divides by zero', () => {
  assert(nutri.percent(1000, 2000) === 50, '50%');
  assert(nutri.percent(3000, 2000) === 100, 'clamped at 100');
  assert(nutri.percent(100, 0) === 0, 'zero target is 0%, not Infinity');
  assert(nutri.percent(-5, 2000) === 0, 'negative clamps to 0');
});
check('scaleFood multiplies macros and keeps a per-unit baseline', () => {
  const item = nutri.scaleFood({ id: 'x', name: 'X', calories: 100, protein: 10, carbs: 5, fat: 2 }, 1.5, 0);
  equal([item.calories, item.protein, item.carbs, item.fat], [150, 15, 7.5, 3], 'scaled macros');
  equal(item.base, { calories: 100, protein: 10, carbs: 5, fat: 2 }, 'baseline');
});
check('requantify is exact and does not compound rounding', () => {
  const item = nutri.scaleFood({ id: 'x', name: 'X', calories: 33.3, protein: 1, carbs: 1, fat: 1 }, 3, 0);
  const back = nutri.requantify(item, 1);
  assert(back.calories === 33.3, `expected 33.3, got ${back.calories}`);
});
check('sumItems and sumMeals agree', () => {
  const items = [
    { calories: 100, protein: 10, carbs: 5, fat: 2 },
    { calories: 50, protein: 5, carbs: 5, fat: 1 },
  ];
  equal(nutri.sumItems(items), { calories: 150, protein: 15, carbs: 10, fat: 3 }, 'sumItems');
  equal(nutri.sumMeals([{ items }, { items }]), { calories: 300, protein: 30, carbs: 20, fat: 6 }, 'sumMeals');
});
check('seriesFromHistory is chronological, exactly N days, zero-filled', () => {
  const series = nutri.seriesFromHistory([], { date: date.todayISO(), totals: { calories: 500 }, water: 1000 }, 7);
  assert(series.length === 7, `expected 7 days, got ${series.length}`);
  assert(series[0].date === date.addDays(date.todayISO(), -6), 'oldest first');
  assert(series[6].date === date.todayISO(), 'today last');
  assert(series[6].calories === 500, 'today from dailyLog');
  assert(series[0].calories === 0, 'padded day is zero');
});
check('streakFromHistory counts back from yesterday when today is empty', () => {
  const today = date.todayISO();
  const history = [
    { date: date.addDays(today, -1) },
    { date: date.addDays(today, -2) },
  ];
  assert(nutri.streakFromHistory(history) === 2, `expected 2, got ${nutri.streakFromHistory(history)}`);
});

console.log('\nfood text parser');
const { parseFoodText } = req('src/utils/parseFoodText');
const { FOODS } = req('src/data/foods');
check('parses "2 eggs and a coffee" into two multiplied items', () => {
  const items = parseFoodText('2 eggs and a coffee', FOODS);
  assert(items && items.length === 2, `expected 2 items, got ${items ? items.length : 'null'}`);
  assert(items[0].calories === 144, `expected 144 kcal for 2 eggs, got ${items[0].calories}`);
});
check('returns null when nothing matches', () => {
  assert(parseFoodText('a bowl of sadness', FOODS) === null, 'must be null');
});
check('never invents food outside the catalogue', () => {
  const items = parseFoodText('900 g dragonfruit', FOODS);
  assert(items === null, 'unknown food must not be fabricated');
});

console.log('\nmeal plan');
const { buildWeekPlan, planTotals } = req('src/utils/mealPlan');
const { RECIPES } = req('src/data/recipes');
check('is deterministic for the same week', () => {
  const a = buildWeekPlan({ recipes: RECIPES, weekStart: '2026-10-26', calorieTarget: 2000 });
  const b = buildWeekPlan({ recipes: RECIPES, weekStart: '2026-10-26', calorieTarget: 2000 });
  equal(a, b, 'same input must produce the same plan');
});
check('produces seven days with four slots each', () => {
  const plan = buildWeekPlan({ recipes: RECIPES, weekStart: '2026-10-26', calorieTarget: 2000 });
  assert(plan.days.length === 7, 'seven days');
  for (const day of plan.days) {
    assert(Object.keys(day.recipeIds).length === 4, 'four slots');
    for (const id of Object.values(day.recipeIds)) {
      assert(RECIPES.some((r) => r.id === id), `recipe ${id} must exist in the catalogue`);
    }
  }
});
check('respects a vegan diet filter', () => {
  const plan = buildWeekPlan({ recipes: RECIPES, weekStart: '2026-10-26', diet: ['vegan'] });
  const used = plan.days.flatMap((d) => Object.values(d.recipeIds));
  for (const id of used) {
    const recipe = RECIPES.find((r) => r.id === id);
    assert(recipe.diet.includes('vegan'), `${recipe.name} is not vegan`);
  }
});
check('planTotals averages per day from the catalogue', () => {
  const plan = buildWeekPlan({ recipes: RECIPES, weekStart: '2026-10-26', calorieTarget: 2000 });
  const byId = new Map(RECIPES.map((r) => [r.id, r]));
  const totals = planTotals(plan, byId);
  assert(totals.perDay.length === 7, 'seven daily totals');
  assert(totals.average.calories > 0, 'average must be positive');
});

// ── reducers ─────────────────────────────────────────────────────────────────
console.log('\nnutrition slice');
const nutrition = req('src/redux/slices/nutritionSlice');
const nutritionReducer = nutrition.default;
const today = date.todayISO();
let state = nutritionReducer(undefined, { type: '@@init' });
state = nutritionReducer(state, nutrition.rollOverDay(today));
check('initial day starts empty and dated today', () => {
  assert(state.dailyLog.date === today, `expected ${today}, got ${state.dailyLog.date}`);
  assert(state.dailyLog.meals.length === 0, 'no meals');
  equal(state.dailyLog.totals, { calories: 0, protein: 0, carbs: 0, fat: 0 }, 'zero totals');
});

const eggItem = nutri.scaleFood(FOODS.find((f) => f.id === 'f-egg'), 2, 0);
const oatItem = nutri.scaleFood(FOODS.find((f) => f.id === 'f-oats'), 1, 1);
state = nutritionReducer(state, nutrition.addMeal({ type: 'breakfast', items: [eggItem, oatItem] }));
check('addMeal recomputes totals from the items', () => {
  assert(state.dailyLog.meals.length === 1, 'one meal');
  assert(state.dailyLog.totals.calories === 294, `expected 294, got ${state.dailyLog.totals.calories}`);
  assert(state.dailyLog.totals.protein === 17.6, `expected 17.6, got ${state.dailyLog.totals.protein}`);
});
check('addMeal ignores an empty meal', () => {
  const before = state.dailyLog.meals.length;
  state = nutritionReducer(state, nutrition.addMeal({ type: 'lunch', items: [] }));
  assert(state.dailyLog.meals.length === before, 'empty meal must not be stored');
});
const mealId = state.dailyLog.meals[0].id;
state = nutritionReducer(
  state,
  nutrition.updateItemQuantity({ mealId, itemId: eggItem.id, quantity: 1 })
);
check('updateItemQuantity recomputes exactly', () => {
  assert(state.dailyLog.totals.calories === 222, `expected 222, got ${state.dailyLog.totals.calories}`);
});
check('water is stored in millilitres and never negative', () => {
  state = nutritionReducer(state, nutrition.addWater(250));
  assert(state.dailyLog.water === 250, 'add 250');
  state = nutritionReducer(state, nutrition.addWater(-1000));
  assert(state.dailyLog.water === 0, 'clamped at zero');
});
check('rollOverDay archives the day and keeps its meals', () => {
  const next = nutritionReducer(state, nutrition.rollOverDay(date.addDays(today, 1)));
  assert(next.history.length === 1, 'one archived day');
  assert(next.history[0].date === today, 'archived date is yesterday');
  assert(next.history[0].meals.length === 1, 'meals survive the rollover');
  assert(next.dailyLog.meals.length === 0, 'new day is empty');
  assert(next.dailyLog.date === date.addDays(today, 1), 'new day is dated');
});
check('rollOverDay does not duplicate an archived date', () => {
  const a = nutritionReducer(state, nutrition.rollOverDay(date.addDays(today, 1)));
  const b = nutritionReducer(a, nutrition.rollOverDay(date.addDays(today, 1)));
  assert(b.history.length === 1, `expected 1 history entry, got ${b.history.length}`);
});
check('rollOverDay discards an empty day instead of padding history', () => {
  let empty = nutritionReducer(undefined, { type: '@@init' });
  empty = nutritionReducer(empty, nutrition.rollOverDay(today));
  const next = nutritionReducer(empty, nutrition.rollOverDay(date.addDays(today, 1)));
  assert(next.history.length === 0, 'empty day must not be archived');
});
check('hydrate restores persisted history', () => {
  const hydrated = nutritionReducer(undefined, {
    type: 'app/hydrate',
    payload: { nutrition: { dailyLog: { date: today, meals: [], water: 500, totals: { calories: 0, protein: 0, carbs: 0, fat: 0 } }, history: [{ date: '2026-10-01' }] } },
  });
  assert(hydrated.history.length === 1, 'history restored');
  assert(hydrated.dailyLog.water === 500, 'water restored');
});

console.log('\nuser slice');
const user = req('src/redux/slices/userSlice');
let userState = user.default(undefined, { type: '@@init' });
check('default targets are complete', () => {
  equal(Object.keys(userState.targets).sort(), ['calories', 'carbs', 'fat', 'micros', 'protein', 'sleep', 'steps', 'water'], 'target keys');
});
check('updateTargets merges rather than replaces', () => {
  userState = user.default(userState, user.updateTargets({ calories: 2400 }));
  assert(userState.targets.calories === 2400, 'calories updated');
  assert(userState.targets.protein === 80, 'protein preserved');
});
check('toggleDiet adds then removes', () => {
  userState = user.default(userState, user.toggleDiet('vegan'));
  assert(userState.preferences.diet.includes('vegan'), 'added');
  userState = user.default(userState, user.toggleDiet('vegan'));
  assert(!userState.preferences.diet.includes('vegan'), 'removed');
});
check('reset clears account data', () => {
  const cleared = user.default(userState, { type: 'app/reset' });
  assert(cleared.id === null && cleared.targets.calories === 2000, 'back to initial');
});

console.log('\ngoals slice');
const goals = req('src/redux/slices/goalsSlice');
let goalState = goals.default(undefined, { type: '@@init' });
goalState = goals.default(goalState, goals.addGoal({ kind: 'water', title: 'Two litres', target: 2000, unit: 'ml' }));
check('addGoal creates a goal with a unique id', () => {
  assert(goalState.items.length === 1, 'one goal');
  assert(/^goal-/.test(goalState.items[0].id), 'prefixed id');
  assert(goalState.items[0].completedAt === null, 'not completed');
});
check('toggleComplete stamps and clears completedAt', () => {
  const id = goalState.items[0].id;
  const done = goals.default(goalState, goals.toggleComplete(id));
  assert(typeof done.items[0].completedAt === 'string', 'stamped');
  const undone = goals.default(done, goals.toggleComplete(id));
  assert(undone.items[0].completedAt === null, 'cleared');
});
check('removeGoal deletes by id', () => {
  const id = goalState.items[0].id;
  const removed = goals.default(goalState, goals.removeGoal(id));
  assert(removed.items.length === 0, 'removed');
});

console.log('\nhealth slice');
const health = req('src/redux/slices/healthSlice');
let healthState = health.default(undefined, { type: '@@init' });
check('health no longer owns water or calories', () => {
  assert(!('waterIntake' in healthState), 'waterIntake removed');
  assert(!('calories' in healthState), 'calories removed');
});
check('logSteps keeps one entry per date, latest wins', () => {
  healthState = health.default(healthState, health.logSteps({ value: 1000, date: '2026-10-26' }));
  healthState = health.default(healthState, health.logSteps({ value: 4000, date: '2026-10-26' }));
  const entries = healthState.steps.history.filter((row) => row.date === '2026-10-26');
  assert(entries.length === 1, `expected 1 entry, got ${entries.length}`);
  assert(entries[0].steps === 4000, 'latest value kept');
  assert(healthState.steps.today === 4000, 'today mirrors latest');
});
check('logWeight rejects nonsense', () => {
  healthState = health.default(healthState, health.logWeight({ value: -5 }));
  assert(healthState.weight.current === null, 'negative weight ignored');
});

console.log('\nsocial slice');
const social = req('src/redux/slices/socialSlice');
let socialState = social.default(undefined, { type: '@@init' });
socialState = social.default(socialState, social.addPost({ body: 'Good day', authorName: 'Sam' }));
check('addPost stores a post with empty likes and comments', () => {
  assert(socialState.posts.length === 1, 'one post');
  equal(socialState.posts[0].likedBy, [], 'no likes');
  equal(socialState.posts[0].comments, [], 'no comments');
});
check('toggleLike is idempotent per user', () => {
  const postId = socialState.posts[0].id;
  socialState = social.default(socialState, social.toggleLike({ postId, userId: 'u1' }));
  assert(socialState.posts[0].likedBy.length === 1, 'liked');
  socialState = social.default(socialState, social.toggleLike({ postId, userId: 'u1' }));
  assert(socialState.posts[0].likedBy.length === 0, 'unliked');
});
check('addComment appends with an id', () => {
  const postId = socialState.posts[0].id;
  socialState = social.default(socialState, social.addComment({ postId, body: 'Nice', authorName: 'Sam' }));
  assert(socialState.posts[0].comments.length === 1, 'one comment');
  assert(Boolean(socialState.posts[0].comments[0].id), 'comment has an id');
});
check('challenges start, mark a day, and stop', () => {
  socialState = social.default(socialState, social.startChallenge('c-hydration-week'));
  assert(socialState.challenges.length === 1, 'started');
  socialState = social.default(socialState, social.startChallenge('c-hydration-week'));
  assert(socialState.challenges.length === 1, 'starting twice is a no-op');
  socialState = social.default(socialState, social.markChallengeDay({ id: 'c-hydration-week', date: '2026-10-26' }));
  equal(socialState.challenges[0].days, ['2026-10-26'], 'day marked');
  socialState = social.default(socialState, social.markChallengeDay({ id: 'c-hydration-week', date: '2026-10-26' }));
  equal(socialState.challenges[0].days, [], 'marking twice untoggles');
});

console.log('\ncatalogue integrity');
check('every food has a positive calorie value and a category', () => {
  for (const food of FOODS) {
    assert(food.calories > 0 || food.id === 'f-coffee' || food.id === 'f-green-tea', `${food.id} calories`);
    assert(food.category, `${food.id} category`);
    assert(food.serving, `${food.id} serving`);
  }
  assert(FOODS.length >= 60, `expected 60+ foods, got ${FOODS.length}`);
});
check('every recipe reconciles macros with its ingredients within 25%', () => {
  const servingGrams = (food) => Number((/(\d+)\s*(?:g|ml)/.exec(food.serving) || [])[1]) || 100;
  const matchFood = (name) => {
    const n = name.toLowerCase();
    return (
      FOODS.find((food) => food.name.toLowerCase() === n) ||
      FOODS.find((food) => food.name.toLowerCase().startsWith(n.slice(0, 9)))
    );
  };
  for (const recipe of RECIPES) {
    const total = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    let matched = 0;
    for (const ingredient of recipe.ingredients) {
      const food = matchFood(ingredient.name);
      if (!food) continue;
      matched += 1;
      const unit = String(ingredient.unit).toLowerCase();
      const q = Number(ingredient.quantity) || 1;
      const factor =
        unit === 'g' || unit === 'ml'
          ? q / servingGrams(food)
          : unit === 'tbsp'
            ? (q * 14) / servingGrams(food)
            : unit === 'tsp'
              ? (q * 5) / servingGrams(food)
              : q;
      total.calories += food.calories * factor;
      total.protein += food.protein * factor;
      total.carbs += food.carbs * factor;
      total.fat += food.fat * factor;
    }
    assert(matched === recipe.ingredients.length, `${recipe.id}: ${recipe.ingredients.length - matched} ingredient(s) not in the catalogue`);
    const perServing = total.calories / recipe.servings;
    const ratio = recipe.calories / perServing;
    assert(
      ratio > 0.8 && ratio < 1.25,
      `${recipe.id} states ${recipe.calories} kcal but ingredients give ~${Math.round(perServing)} (ratio ${ratio.toFixed(2)})`
    );
  }
});
check('every workout has exercises and a plausible calorie estimate', () => {
  const workouts = req('src/data/workouts').WORKOUTS;
  for (const workout of workouts) {
    assert(workout.exercises.length > 0, `${workout.id} exercises`);
    const perMinute = workout.calories / workout.minutes;
    assert(perMinute > 2 && perMinute < 20, `${workout.id} ${perMinute.toFixed(1)} kcal/min`);
  }
});
check('challenges have no invented participant counts', () => {
  const challenges = req('src/data/challenges').CHALLENGES;
  for (const challenge of challenges) {
    assert(!('participants' in challenge), `${challenge.id} has a fake participant count`);
    assert(challenge.dailyGoal > 0, `${challenge.id} daily goal`);
  }
});


// ── micronutrients, portions, migration ──────────────────────────────────────
console.log('\nmicronutrients');
const microsModule = req('src/data/micros');
check('zeros covers every tracked nutrient', () => {
  const z = microsModule.zeros();
  equal(Object.keys(z).sort(), microsModule.MICRO_KEYS.slice().sort(), 'keys');
  assert(microsModule.MICRO_KEYS.every((k) => z[k] === 0), 'all zero');
});
check('scaleFood scales micronutrients and flags unknown data', () => {
  const withMicros = nutri.scaleFood(
    { id: 'x', name: 'X', calories: 100, protein: 1, carbs: 1, fat: 1, micros: { iron: 2, calcium: 100 } },
    2,
    0
  );
  assert(withMicros.microsKnown === true, 'known');
  assert(withMicros.micros.iron === 4, `iron expected 4, got ${withMicros.micros.iron}`);
  assert(withMicros.micros.calcium === 200, 'calcium scaled');

  const withoutMicros = nutri.scaleFood({ id: 'y', name: 'Y', calories: 10, protein: 0, carbs: 0, fat: 0 }, 1, 1);
  assert(withoutMicros.microsKnown === false, 'unknown flagged');
  assert(withoutMicros.micros.iron === 0, 'zeros, not undefined');
});
check('requantify keeps micronutrients exact', () => {
  const item = nutri.scaleFood(
    { id: 'x', name: 'X', calories: 100, protein: 1, carbs: 1, fat: 1, micros: { iron: 3 } },
    3,
    0
  );
  const back = nutri.requantify(item, 1);
  assert(back.micros.iron === 3, `expected 3, got ${back.micros.iron}`);
});
check('sumItemMicros adds across items', () => {
  const items = [
    { micros: { iron: 1.5, calcium: 100 } },
    { micros: { iron: 2.5, calcium: 50 } },
  ];
  const total = nutri.sumItemMicros(items);
  assert(total.iron === 4, `iron expected 4, got ${total.iron}`);
  assert(total.calcium === 150, 'calcium');
});

console.log('\nIndian reference intakes');
const rda = req('src/data/indianRda');
check('adult women get the higher Indian iron and calcium values', () => {
  const value = rda.rdaFor({ sex: 'female', age: 30 });
  assert(value.iron === 29, `iron expected 29, got ${value.iron}`);
  assert(value.calcium === 1000, `calcium expected 1000, got ${value.calcium}`);
  assert(value.fiber === 25, 'fibre');
});
check('adult men differ from women where the science says so', () => {
  const value = rda.rdaFor({ sex: 'male', age: 30 });
  assert(value.iron === 19, 'iron');
  assert(value.zinc === 17, 'zinc');
  assert(value.fiber === 30, 'fibre');
});
check('pregnancy raises iron, folate and calcium', () => {
  const value = rda.rdaFor({ sex: 'female', age: 28, pregnant: true });
  assert(value.iron === 27, 'iron');
  assert(value.folate === 500, 'folate');
  assert(value.calcium === 1200, 'calcium');
});
check('children scale down but keep adult iron and calcium', () => {
  const value = rda.rdaFor({ sex: 'male', age: 7 });
  assert(value.iron === 19, 'iron not scaled');
  assert(value.calcium === 1000, 'calcium not scaled');
  assert(value.zinc < 17, 'zinc scaled');
});

console.log('\nSI portions');
const portions = req('src/utils/portions');
check('reads the weight out of a serving label', () => {
  assert(portions.gramsFromServing('150 g') === 150, 'grams');
  assert(portions.gramsFromServing('240 ml') === 240, 'millilitres');
  assert(portions.gramsFromServing('1 serving') === null, 'no weight');
});
check('one serving resolves to its gram weight', () => {
  const out = portions.resolvePortion({ food: { serving: '150 g' }, count: 1 });
  assert(out.grams === 150, 'expected 150 g, got ' + out.grams);
  assert(out.quantity === 1, 'quantity 1');
  assert(out.label === '150 g', out.label);
});
check('two servings double the weight', () => {
  const out = portions.resolvePortion({ food: { serving: '150 g' }, count: 2 });
  assert(out.grams === 300, 'expected 300, got ' + out.grams);
  assert(out.quantity === 2, 'quantity 2');
});
check('an explicit gram amount drives the quantity', () => {
  const out = portions.resolvePortion({ food: { serving: '150 g' }, grams: 75 });
  assert(out.grams === 75, 'grams');
  assert(out.quantity === 0.5, 'half a serving, got ' + out.quantity);
});
check('a food with no weight never invents one', () => {
  const out = portions.resolvePortion({ food: { serving: '1 serving' }, count: 1 });
  assert(out.grams === null, 'grams must be null, got ' + out.grams);
  assert(out.resolved === false, 'flagged unresolved');
});
check('no catalogue food still carries a household measure', () => {
  const all = [...req('src/data/foods').FOODS, ...req('src/data/indianDishes').INDIAN_DISHES];
  const offenders = all.filter((food) => /katori|bowl|plate|roti|\bcup\b/i.test(food.serving));
  assert(offenders.length === 0, 'household measures left: ' + offenders.slice(0, 5).map((f) => f.id).join(', '));
});
check('every dish declares its serving in grams or millilitres', () => {
  const dishes = req('src/data/indianDishes').INDIAN_DISHES;
  const bad = dishes.filter((dish) => !/\d+\s*(g|ml)\b/i.test(dish.serving));
  assert(bad.length === 0, 'without SI serving: ' + bad.slice(0, 5).map((d) => d.id).join(', '));
});

console.log('\nIndian dishes');
const dishes = req('src/data/indianDishes').INDIAN_DISHES;
check('at least 40 Indian dishes, all typed as dishes', () => {
  assert(dishes.length >= 40, 'expected 40+, got ' + dishes.length);
  for (const dish of dishes) {
    assert(dish.kind === 'dish', dish.id + ' kind');
    assert(!dish.portions, dish.id + ' still carries household portions');
  }
});
check('every dish reconciles macros with its calories within 30 %', () => {
  for (const dish of dishes) {
    const derived = 4 * dish.protein + 4 * dish.carbs + 9 * dish.fat;
    const ratio = derived / dish.calories;
    assert(
      ratio > 0.7 && ratio < 1.3,
      `${dish.id}: 4P+4C+9F = ${Math.round(derived)} vs ${dish.calories} kcal`
    );
  }
});
check('no duplicate ids or names between foods and dishes', () => {
  const foods = req('src/data/foods').FOODS;
  const all = [...foods, ...dishes];
  const ids = new Set();
  const names = new Set();
  for (const item of all) {
    assert(!ids.has(item.id), `duplicate id ${item.id}`);
    ids.add(item.id);
    const key = item.name.toLowerCase();
    assert(!names.has(key), `duplicate name ${item.name}`);
    names.add(key);
  }
});

console.log('\nmigration');
const migration = req('src/redux/migrations');
check('a v1 nutrition slice gains micros and keeps its meals', () => {
  const legacy = {
    dailyLog: { date: '2026-10-01', water: 500, meals: [{ id: 'm1', type: 'lunch', items: [{ id: 'i1', name: 'Dal' }], total: {} }], totals: { calories: 150 } },
  };
  const out = migration.migrateSlice('nutrition', legacy);
  assert(out.dailyLog.micros.iron === 0, 'micros defaulted');
  assert(out.dailyLog.meals[0].items[0].microsKnown === false, 'item flagged unknown');
  assert(out.dailyLog.water === 500, 'water preserved');
});
check('migration is idempotent', () => {
  const legacy = { targets: { calories: 2200 }, stats: { sex: 'female', age: 31 } };
  const once = migration.migrateSlice('user', legacy);
  const twice = migration.migrateSlice('user', once);
  equal(twice, once, 'second pass changes nothing');
  assert(once.targets.micros.iron === 29, 'RDA applied from stored sex and age');
});
check('migration never throws on corrupt input', () => {
  assert(migration.migrateSlice('nutrition', 'not-an-object') === undefined, 'string rejected');
  assert(migration.migrateSlice('nutrition', 42) === undefined, 'number rejected');
  assert(migration.migrateSlice('nutrition', null) === undefined, 'null rejected');
});

console.log('\nhealth score');
const scoreModule = req('src/utils/score');
const perfectTargets = { calories: 2000, protein: 80, micros: rda.rdaFor({ sex: 'male', age: 30 }) };
const perfectMicros = { ...microsModule.zeros(), ...perfectTargets.micros };
check('a fully met day scores 100 and the parts sum to it', () => {
  const result = scoreModule.healthScore({
    totals: { calories: 2000, protein: 80 },
    micros: perfectMicros,
    targets: perfectTargets,
    water: 2000,
    waterTarget: 2000,
    mealCount: 3,
  });
  assert(result.score === 100, `expected 100, got ${result.score}`);
  const sum = result.parts.reduce((total, part) => total + part.points, 0);
  assert(sum === result.score, 'parts sum to score');
});
check('an empty day scores zero rather than guessing', () => {
  const result = scoreModule.healthScore({
    totals: { calories: 0, protein: 0 },
    micros: microsModule.zeros(),
    targets: perfectTargets,
    water: 0,
    waterTarget: 2000,
    mealCount: 0,
  });
  assert(result.score === 0, `expected 0, got ${result.score}`);
  assert(result.band === 'poor', 'band');
});
check('being 20 % over target costs some calorie points but not all', () => {
  const result = scoreModule.healthScore({
    totals: { calories: 2400, protein: 80 },
    micros: perfectMicros,
    targets: perfectTargets,
    water: 2000,
    waterTarget: 2000,
    mealCount: 3,
  });
  const calories = result.parts.find((part) => part.key === 'calories');
  assert(calories.points > 0 && calories.points < calories.max, `partial, got ${calories.points}`);
});

console.log('\nfasting window');
const fasting = req('src/utils/fasting');
check('derives the eating window from first and last meal', () => {
  const out = fasting.fastingWindow([
    { time: '2026-10-27T08:00:00.000Z' },
    { time: '2026-10-27T13:00:00.000Z' },
    { time: '2026-10-27T20:30:00.000Z' },
  ]);
  assert(out.eatingMinutes === 750, `expected 750, got ${out.eatingMinutes}`);
  assert(out.fastingMinutes === 1440 - 750, 'fasting complement');
});
check('one meal is not a window', () => {
  assert(fasting.fastingWindow([{ time: '2026-10-27T08:00:00.000Z' }]) === null, 'null');
  assert(fasting.fastingWindow([]) === null, 'empty is null');
});

console.log('\nadaptive expenditure');
const expenditure = req('src/utils/expenditure');
const buildDays = (count, calories, startWeight, kgPerDay) => {
  const history = [];
  const weights = [];
  for (let i = 0; i < count; i += 1) {
    const day = date.addDays('2026-09-01', i);
    history.push({ date: day, totals: { calories } });
    weights.push({ date: day, value: Math.round((startWeight - kgPerDay * i) * 10) / 10 });
  }
  return { history, weights };
};
check('refuses to guess below ten paired days', () => {
  const { history, weights } = buildDays(6, 2000, 80, 0.1);
  const out = expenditure.estimateExpenditure({ history, weights });
  assert(out.tdee === null, 'no number');
  assert(out.confidence === 'none', out.confidence);
});
check('losing weight on a known intake implies a higher expenditure', () => {
  const { history, weights } = buildDays(24, 2000, 80, 0.1);
  const out = expenditure.estimateExpenditure({ history, weights });
  assert(out.confidence === 'high', `confidence ${out.confidence}`);
  // 2000 - (-0.1 * 7700) = 2770
  assert(Math.abs(out.tdee - 2770) <= 40, `expected about 2770, got ${out.tdee}`);
});
check('holding weight on 2000 kcal implies about 2000', () => {
  const { history, weights } = buildDays(21, 2000, 80, 0);
  const out = expenditure.estimateExpenditure({ history, weights });
  assert(Math.abs(out.tdee - 2000) <= 30, `expected about 2000, got ${out.tdee}`);
});
check('stays inside a believable range', () => {
  const { history, weights } = buildDays(21, 5000, 80, 0.6);
  const out = expenditure.estimateExpenditure({ history, weights });
  assert(out.tdee <= 6000, `clamped high, got ${out.tdee}`);
});

console.log('\nCSV');
const csv = req('src/utils/csv');
check('quotes commas, quotes and newlines', () => {
  const out = csv.toCSV(
    [{ name: 'Chicken breast, grilled', note: 'he said "hi"' }],
    [{ key: 'name', label: 'name' }, { key: 'note', label: 'note' }]
  );
  assert(out.split('\r\n')[1] === '"Chicken breast, grilled","he said ""hi"""', out);
});
check('round-trips through the parser', () => {
  const rows = csv.parseCSV('a,b\r\n"x, y","q""z"\r\n');
  equal(rows, [['a', 'b'], ['x, y', 'q"z']], 'parsed');
});

console.log('\ndata transfer');
const transfer = req('src/services/dataTransfer');
const transferState = {
  user: { name: 'Sam', targets: { calories: 2000 } },
  nutrition: {
    dailyLog: { date: '2026-10-27', meals: [], water: 500, totals: { calories: 300, protein: 10, carbs: 20, fat: 5 }, micros: { iron: 3 } },
    history: [{ date: '2026-10-26', meals: [], water: 1000, totals: { calories: 1800, protein: 70, carbs: 200, fat: 60 }, micros: { iron: 12 } }],
  },
};
check('export carries a format and schema version', () => {
  const out = transfer.buildExport(transferState, { name: 'Sam' });
  assert(out.format === 'bitewise-export', 'format');
  assert(out.schemaVersion === migration.SCHEMA_VERSION, 'version');
  assert(Boolean(out.data.nutrition), 'nutrition included');
});
check('CSV has one row per day, oldest first', () => {
  const text = transfer.exportToCSV(transferState);
  const rows = csv.parseCSV(text);
  assert(rows.length === 3, `expected header + 2 rows, got ${rows.length}`);
  assert(rows[1][0] === '2026-10-26', 'oldest first');
  assert(rows[2][0] === '2026-10-27', 'today last');
});
check('import rejects a foreign file', () => {
  assert(transfer.importFromJSON('{"hello":1}').ok === false, 'rejected');
  assert(transfer.importFromJSON('not json').ok === false, 'parse error handled');
});
check('import rejects a newer schema with a readable reason', () => {
  const out = transfer.importFromJSON(
    JSON.stringify({ format: 'bitewise-export', schemaVersion: 99, data: {} })
  );
  assert(out.ok === false, 'rejected');
  assert(/newer version/.test(out.error), out.error);
});
check('import accepts its own export', () => {
  const json = transfer.exportToJSON(transferState, {});
  const out = transfer.importFromJSON(json);
  assert(out.ok === true, out.error);
  const summary = transfer.summariseImport(out.data);
  assert(summary.days === 2, `expected 2 days, got ${summary.days}`);
});

console.log('\nOpen Food Facts mapping');
const off = req('src/services/openFoodFacts');
check('maps a per-serving product', () => {
  const food = off.mapProduct({
    code: '12345678',
    product_name: 'Masala Oats',
    brands: 'Saffola',
    serving_size: '40 g',
    nutriments: {
      'energy-kcal_serving': 150,
      proteins_serving: 5,
      carbohydrates_serving: 26,
      fat_serving: 3.5,
      fiber_serving: 4,
      sodium_serving: 0.4,
      iron_serving: 0.003,
    },
    ingredients_analysis_tags: ['en:vegetarian'],
    allergens_tags: ['en:gluten'],
    nutriscore_grade: 'b',
  });
  assert(food.calories === 150, `calories ${food.calories}`);
  assert(food.serving === '40 g', food.serving);
  assert(food.micros.sodium === 400, `sodium mg ${food.micros.sodium}`);
  assert(food.micros.iron === 3, `iron mg ${food.micros.iron}`);
  assert(food.diet.includes('vegetarian'), 'diet');
  assert(food.allergens.includes('gluten'), 'allergen');
});
check('falls back to per-100g and labels the serving honestly', () => {
  const food = off.mapProduct({
    product_name: 'Plain Oats',
    nutriments: { 'energy-kcal_100g': 380, proteins_100g: 13, carbohydrates_100g: 60, fat_100g: 7 },
  });
  assert(food.calories === 380, 'calories');
  assert(food.serving === '100 g', `serving should say 100 g, got ${food.serving}`);
  // Nothing was invented for nutrients the product did not publish.
  assert(
    microsModule.MICRO_KEYS.every((key) => Number(food.micros[key]) === 0),
    'no fabricated micronutrients'
  );
});
check('a product without energy is not loggable', () => {
  assert(off.mapProduct({ product_name: 'Mystery' }) === null, 'null without energy');
});


console.log('\ndataset import');
const datasetImport = req('src/services/datasetImport');
check('reads CSV with INDB-style column names', () => {
  const csv = [
    'food_name,serving_size,energy_kcal,protein_g,carbohydrate_g,fat_g,iron_mg,calcium_mg,household_measure',
    'Rajma,150 g,190,9,27,5,3.2,48,1 katori',
    'Dal tadka,150 g,150,8,18,5,2.4,30,1 katori',
  ].join('\n');
  const out = datasetImport.parseFoodDataset(csv);
  assert(out.foods.length === 2, 'expected 2 foods, got ' + out.foods.length);
  assert(out.foods[0].calories === 190, 'calories');
  assert(out.foods[0].micros.iron === 3.2, 'iron mapped');
  assert(out.foods[0].micros.calcium === 48, 'calcium mapped');
  assert(out.foods[0].name === 'Rajma', 'name mapped');
});
check('reads a JSON array of foods', () => {
  const out = datasetImport.parseFoodDataset(
    JSON.stringify([{ name: 'Poha', calories: 250, serving: '1 bowl', protein: 5 }])
  );
  assert(out.foods.length === 1, 'one food');
  assert(out.foods[0].protein === 5, 'protein');
});
check('accepts a { foods: [...] } wrapper', () => {
  const out = datasetImport.parseFoodDataset(
    JSON.stringify({ foods: [{ name: 'Idli', calories: 130 }] })
  );
  assert(out.foods.length === 1, 'one food');
});
check('reports rows it cannot use instead of dropping them silently', () => {
  const out = datasetImport.parseFoodDataset('name,calories\nGood,200\n,300\nBad,abc');
  assert(out.foods.length === 1, 'expected 1 usable, got ' + out.foods.length);
  assert(out.errors.length === 2, 'expected 2 errors, got ' + out.errors.length);
});
check('rejects nonsense input with a readable reason', () => {
  assert(datasetImport.parseFoodDataset('').errors.length === 1, 'empty');
  assert(datasetImport.parseFoodDataset('{broken').errors.length === 1, 'bad json');
});
check('the documented template is itself valid', () => {
  const out = datasetImport.parseFoodDataset(datasetImport.DATASET_TEMPLATE);
  assert(out.foods.length === 1, 'template must parse: ' + out.errors.join('; '));
  assert(out.foods[0].kind === 'dish', 'kind respected');
});
check('bulk add skips duplicates by name', () => {
  const reducer = req('src/redux/slices/nutritionSlice');
  let state = reducer.default(undefined, { type: '@@init' });
  const foods = [
    { id: 'a', name: 'Rajma', calories: 190 },
    { id: 'b', name: 'rajma', calories: 200 },
    { id: 'c', name: 'Chole', calories: 210 },
  ];
  state = reducer.default(state, reducer.addCustomFoods(foods));
  assert(state.customFoods.length === 2, 'expected 2, got ' + state.customFoods.length);
});


console.log('\nretrieval (the R in RAG)');
const retrieval = req('src/utils/retrieval');
check('finds an Indian dish from a household phrasing', () => {
  const hits = retrieval.retrieveFoods('2 katori dal');
  assert(hits.length > 0, 'expected hits');
  assert(
    hits.some((food) => /dal/i.test(food.name)),
    'top hits: ' + hits.slice(0, 3).map((f) => f.name).join(', ')
  );
});
check('finds rajma from a compound dish request', () => {
  const hits = retrieval.retrieveFoods('rajma chawal for lunch');
  assert(hits.some((food) => /rajma/i.test(food.name)), 'no rajma in ' + hits.map((f) => f.name).join(', '));
});
check('ignores quantity words rather than matching them', () => {
  const hits = retrieval.retrieveFoods('a bowl of two pieces');
  assert(hits.length === 0, 'should match nothing, got ' + hits.length);
});
check('returns nothing for gibberish instead of guessing', () => {
  assert(retrieval.retrieveFoods('zzzqqq').length === 0, 'expected empty');
});
check('respects the limit', () => {
  const hits = retrieval.retrieveFoods('rice chicken dal roti paneer', { limit: 3 });
  assert(hits.length === 3, 'expected 3, got ' + hits.length);
});
check('default candidates lead with Indian dishes', () => {
  const candidates = retrieval.defaultCandidates({ limit: 10 });
  assert(candidates.length === 10, 'expected 10');
  const dishes = req('src/data/indianDishes').INDIAN_DISHES;
  const dishIds = new Set(dishes.map((d) => d.id));
  assert(candidates.filter((c) => dishIds.has(c.id)).length >= 7, 'majority should be dishes');
});
check('formats candidates one per line with ids', () => {
  const text = retrieval.formatCandidates([
    { id: 'd-dal-tadka', name: 'Dal tadka', serving: '1 katori', calories: 150, protein: 8, carbs: 18, fat: 5 },
  ]);
  assert(text.split('\n').length === 1, 'one line');
  assert(text.includes('d-dal-tadka'), 'id present');
  assert(text.includes('150 kcal'), 'numbers present');
});


console.log('\nAI provider config');
const aiConfig = req('src/services/aiConfig');
check('a pasted key alone is enough to configure the provider', () => {
  const config = aiConfig.readConfig({
    provider: 'openrouter',
    apiKey: 'sk-or-v1-test',
    baseUrl: '',
    visionModel: '',
    chatModel: '',
  });
  assert(config.chatReady === true, 'chatReady must be true with only a key');
  assert(config.ready === true, 'vision must be ready with only a key');
  assert(config.chatModel === aiConfig.DEFAULT_SETTINGS.chatModel, 'chat model falls back to the default');
  assert(config.visionModel === aiConfig.DEFAULT_SETTINGS.visionModel, 'vision model falls back to the default');
});
check('empty strings never override the defaults', () => {
  const config = aiConfig.readConfig({ apiKey: 'k', visionModel: '', chatModel: '' });
  assert(config.visionModel.length > 0, 'vision model must not be blank');
  assert(config.chatModel.length > 0, 'chat model must not be blank');
});
check('no key means not configured', () => {
  assert(aiConfig.readConfig({ apiKey: '' }).chatReady === false, 'empty key');
  assert(aiConfig.readConfig({ apiKey: '   ' }).chatReady === false, 'whitespace key');
  assert(aiConfig.readConfig(null).ready === false, 'null settings');
});
check('a custom endpoint needs a base URL', () => {
  assert(aiConfig.readConfig({ provider: 'custom', apiKey: 'k', baseUrl: '' }).ready === false, 'no base url');
  assert(
    aiConfig.readConfig({ provider: 'custom', apiKey: 'k', baseUrl: 'https://example.test/v1' }).ready === true,
    'with base url'
  );
});
check('an explicit model wins over the default', () => {
  const config = aiConfig.readConfig({ apiKey: 'k', chatModel: 'someone/model:free' });
  assert(config.chatModel === 'someone/model:free', config.chatModel);
});
check('base URL is normalised without a trailing slash', () => {
  const config = aiConfig.readConfig({ apiKey: 'k' });
  assert(!config.baseUrl.endsWith('/'), config.baseUrl);
  assert(config.baseUrl === 'https://openrouter.ai/api/v1', config.baseUrl);
});


console.log('\ncatalogue overrides');
const overridesUtil = req('src/utils/foodOverrides');
check('an override replaces macros but leaves the rest of the row alone', () => {
  const food = { id: 'd-dal', name: 'Dal', serving: '150 g', calories: 150, protein: 8, carbs: 18, fat: 5, micros: { iron: 2 } };
  const out = overridesUtil.applyOverride(food, { 'd-dal': { calories: 200, iron: 9 } });
  assert(out.calories === 200, 'calories overridden');
  assert(out.protein === 8, 'protein untouched');
  assert(out.name === 'Dal', 'name untouched');
  assert(out.edited === true, 'marked edited');
});
check('micronutrient overrides merge rather than replace', () => {
  const food = { id: 'x', calories: 100, micros: { iron: 2, calcium: 50 } };
  const out = overridesUtil.applyOverride(food, { x: { micros: { iron: 5 } } });
  assert(out.micros.iron === 5, 'iron replaced');
  assert(out.micros.calcium === 50, 'calcium kept');
});
check('a food with no override is returned untouched', () => {
  const food = { id: 'y', calories: 100 };
  assert(overridesUtil.applyOverride(food, {}) === food, 'same object');
});
check('a form patch clamps negatives and drops empty micronutrients', () => {
  const patch = overridesUtil.normaliseOverride({
    calories: -50, protein: '12', carbs: 20, fat: 3, serving: ' 120 g ', iron: 0, calcium: 40,
  });
  assert(patch.calories === 0, 'negative clamped');
  assert(patch.protein === 12, 'string parsed');
  assert(patch.serving === '120 g', 'serving trimmed');
  assert(patch.micros.calcium === 40, 'calcium kept');
  assert(!('iron' in patch.micros), 'zero dropped');
});

console.log('\nshopping list');
const mealPlanUtil = req('src/utils/mealPlan');
const fakeRecipes = new Map([
  ['r1', { id: 'r1', name: 'Dal', ingredients: [
    { name: 'Lentils', quantity: 200, unit: 'g' },
    { name: 'Olive oil', quantity: 1, unit: 'tbsp' },
    { name: 'Milk', quantity: 100, unit: 'ml' },
  ] }],
  ['r2', { id: 'r2', name: 'Soup', ingredients: [
    { name: 'Lentils', quantity: 100, unit: 'g' },
    { name: 'Olive oil', quantity: 2, unit: 'tbsp' },
    { name: 'Milk', quantity: 1, unit: 'cup' },
  ] }],
]);
const fakePlan = {
  weekStart: '2026-10-26',
  days: [
    { date: '2026-10-26', recipeIds: { breakfast: null, lunch: 'r1', dinner: 'r2', snack: null } },
    { date: '2026-10-27', recipeIds: { breakfast: null, lunch: 'r1', dinner: null, snack: null } },
  ],
};
check('the same ingredient in the same unit is summed', () => {
  const list = mealPlanUtil.buildShoppingList(fakePlan, fakeRecipes);
  const lentils = list.find((item) => item.name === 'Lentils');
  assert(lentils, 'lentils present');
  // r1 appears twice (200 g each) plus r2 (100 g)
  assert(lentils.quantity === 500, 'expected 500 g, got ' + lentils.quantity);
  assert(lentils.recipes.length === 2, 'two recipes referenced');
});
check('different units stay on separate lines instead of being added', () => {
  const list = mealPlanUtil.buildShoppingList(fakePlan, fakeRecipes);
  const milk = list.filter((item) => item.name === 'Milk');
  assert(milk.length === 2, 'expected a row per unit, got ' + milk.length);
  const units = milk.map((item) => item.unit).sort();
  assert(JSON.stringify(units) === JSON.stringify(['cup', 'ml']), 'units: ' + units.join(', '));
});
check('no plan yields an empty list', () => {
  assert(mealPlanUtil.buildShoppingList(null, fakeRecipes).length === 0, 'null plan');
  assert(mealPlanUtil.buildShoppingList({ days: [] }, fakeRecipes).length === 0, 'empty week');
});
check('rows come back sorted by name', () => {
  const list = mealPlanUtil.buildShoppingList(fakePlan, fakeRecipes);
  const names = list.map((item) => item.name);
  assert(JSON.stringify(names) === JSON.stringify([...names].sort()), 'sorted: ' + names.join(', '));
});


console.log('\nmeal memory');
const templatesUtil = req('src/utils/mealTemplates');
check('a template merges the meals of one type and totals them', () => {
  const meals = [
    { id: 'm1', type: 'breakfast', items: [{ id: 'i1', name: 'Oats', calories: 150, protein: 5, carbs: 27, fat: 3 }] },
    { id: 'm2', type: 'breakfast', items: [{ id: 'i2', name: 'Egg', calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8 }] },
    { id: 'm3', type: 'lunch', items: [{ id: 'i3', name: 'Dal', calories: 150, protein: 8, carbs: 18, fat: 5 }] },
  ];
  const template = templatesUtil.buildTemplate(meals, { type: 'breakfast' });
  assert(template.items.length === 2, 'two breakfast items, got ' + template.items.length);
  assert(template.total.calories === 222, 'total 222, got ' + template.total.calories);
  assert(template.name === 'My usual breakfast', template.name);
});
check('a template with nothing in it is not created', () => {
  assert(templatesUtil.buildTemplate([], { type: 'lunch' }) === null, 'empty');
  assert(templatesUtil.buildTemplate([{ type: 'lunch', items: [] }], { type: 'lunch' }) === null, 'no items');
});
check('recent meals de-duplicate and come newest first', () => {
  const history = [
    { date: '2026-10-26', meals: [{ type: 'lunch', items: [{ name: 'Rajma' }], total: { calories: 190 } }] },
  ];
  const dailyLog = {
    date: '2026-10-27',
    meals: [
      { type: 'breakfast', items: [{ name: 'Poha' }], total: { calories: 250 } },
      { type: 'lunch', items: [{ name: 'Rajma' }], total: { calories: 190 } },
    ],
  };
  const recent = templatesUtil.recentMeals(history, dailyLog, { limit: 5 });
  assert(recent.length === 2, 'deduped to 2, got ' + recent.length);
  assert(recent[0].type === 'lunch', 'newest first, got ' + recent[0].type);
});

console.log('\ninsights');
const insightsUtil = req('src/utils/insights');
const insightTargets = {
  protein: 80,
  micros: { iron: 19, calcium: 1000, vitaminD: 15 },
};
const makeDay = (dateIso, calories, protein, iron) => ({
  date: dateIso,
  totals: { calories, protein, carbs: 0, fat: 0 },
  micros: { iron, calcium: 900, vitaminD: 5 },
});

// Days must fall inside the windows the engine looks at, so build them back from
// today rather than using fixed dates.
const recentDays = (count, calories, protein, iron) => {
  const today = date.todayISO();
  const out = [];
  for (let i = 1; i <= count; i += 1) out.push(makeDay(date.addDays(today, -i), calories, protein, iron));
  return out;
};

check('fewer than three logged days reports thin records instead of patterns', () => {
  const out = insightsUtil.buildInsights({
    history: [makeDay(date.addDays(date.todayISO(), -1), 1800, 70, 10)],
    dailyLog: makeDay(date.todayISO(), 0, 0, 0),
    targets: insightTargets,
  });
  assert(out.insights.length === 1, 'one insight, got ' + out.insights.length);
  assert(out.insights[0].id === 'thin-records', out.insights[0].id);
});
check('a nutrient short on most days becomes an insight with its arithmetic', () => {
  const history = recentDays(10, 1900, 85, 6);
  const out = insightsUtil.buildInsights({
    history,
    dailyLog: makeDay(date.todayISO(), 1900, 85, 6),
    targets: insightTargets,
    foods: req('src/data/foods').FOODS,
  });
  const iron = out.insights.find((insight) => insight.id === 'gap-iron');
  assert(iron, 'no iron insight in ' + out.insights.map((i) => i.id).join(', '));
  assert(/11\/11 days/.test(iron.evidence), 'evidence states the count: ' + iron.evidence);
  assert(iron.suggestion && iron.suggestion.foods.length > 0, 'offers catalogue foods');
});
check('a well-met nutrient is reported as such, not as a gap', () => {
  const history = recentDays(10, 2000, 90, 30);
  const out = insightsUtil.buildInsights({
    history,
    dailyLog: null,
    // Only iron has a target here, so the positive note must be about iron.
    targets: { protein: 80, micros: { iron: 19 } },
  });
  assert(!out.insights.some((insight) => insight.id === 'gap-iron'), 'no iron gap');
  assert(out.insights.some((insight) => insight.id === 'met-iron'), 'iron reported as met, got ' + out.insights.map((i) => i.id).join(', '));
});
check('every insight carries an evidence line', () => {
  const out = insightsUtil.buildInsights({
    history: recentDays(12, 2000, 40, 4),
    targets: insightTargets,
    foods: req('src/data/foods').FOODS,
  });
  for (const insight of out.insights) {
    assert(typeof insight.evidence === 'string' && insight.evidence.length > 0, insight.id + ' has no evidence');
  }
});
check('with no targets set it says nothing rather than inventing', () => {
  const out = insightsUtil.buildInsights({ history: recentDays(8, 1800, 60, 5), targets: {}, foods: [] });
  assert(out.insights.every((insight) => !insight.id.startsWith('gap-')), 'no gap claims without targets');
});
check('the window actually limits what is examined', () => {
  const history = recentDays(40, 1900, 85, 6);
  const wide = insightsUtil.buildInsights({ history, targets: insightTargets, windowDays: 30 });
  const narrow = insightsUtil.buildInsights({ history, targets: insightTargets, windowDays: 14 });
  assert(wide.daysWithRecords > narrow.daysWithRecords, 'wider window should see more days');
});

// ── summary ──────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const failure of failures) console.log(`  - ${failure.name}: ${failure.message}`);
  process.exit(1);
}
