// Personal challenges. These are goals one person sets for themselves — there is
// no participant count and no leaderboard, because the app has one local user.

/** @type {import('../types').Challenge[]} */
export const CHALLENGES = [
  {
    id: 'c-hydration-week',
    title: 'Hydration week',
    description: 'Hit your water target every day for a week. Start on any day.',
    days: 7,
    metric: 'water',
    dailyGoal: 2000,
    unit: 'ml',
  },
  {
    id: 'c-step-starter',
    title: 'Step starter',
    description: 'Eight thousand steps a day for five days. Five is enough to feel it.',
    days: 5,
    metric: 'steps',
    dailyGoal: 8000,
    unit: 'steps',
  },
  {
    id: 'c-move-three',
    title: 'Move three times',
    description: 'Log one workout a day for three days. Any type counts.',
    days: 3,
    metric: 'workouts',
    dailyGoal: 1,
    unit: 'workout',
  },
  {
    id: 'c-move-every-day',
    title: 'Move every day',
    description: 'One logged workout a day for a week. Mobility sessions count.',
    days: 7,
    metric: 'workouts',
    dailyGoal: 1,
    unit: 'workout',
  },
];

export default CHALLENGES;
