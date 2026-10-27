// Storage keys. One namespace, so a wipe is one prefix.
export const NAMESPACE = '@bitewise/';

export const KEYS = {
  session: 'session',
  accounts: 'accounts',
  schemaVersion: 'schemaVersion',
  user: 'user',
  nutrition: 'nutrition',
  health: 'health',
  fitness: 'fitness',
  meal: 'meal',
  recipe: 'recipe',
  chat: 'chat',
  social: 'social',
  goals: 'goals',
};

export const fullKey = (key) => `${NAMESPACE}${key}`;
