/**
 * Domain models. JSDoc only — no build step, no TypeScript (see ADR-004).
 * Editors get completion and hover types from these annotations.
 *
 * @typedef {'breakfast'|'lunch'|'dinner'|'snack'} MealType
 * @typedef {'fruit'|'vegetable'|'grain'|'protein'|'dairy'|'fat'|'drink'|'snack'|'prepared'} FoodCategory
 * @typedef {'local'|'firebase'} AuthMode
 * @typedef {'metric'|'imperial'} Units
 *
 * @typedef {Object} Macros
 * @property {number} calories
 * @property {number} protein   grams
 * @property {number} carbs     grams
 * @property {number} fat       grams
 *
 * Grams for fibre and sugar; milligrams for the minerals and vitamin C;
 * micrograms for B12, folate and vitamin D. A missing key means "unknown", never
 * zero — the UI must be able to tell the difference.
 *
 * @typedef {Object} Micros
 * @property {number} [fiber]
 * @property {number} [sugar]
 * @property {number} [sodium]
 * @property {number} [calcium]
 * @property {number} [iron]
 * @property {number} [zinc]
 * @property {number} [magnesium]
 * @property {number} [potassium]
 * @property {number} [vitaminC]
 * @property {number} [vitaminB12]
 * @property {number} [folate]
 * @property {number} [vitaminD]
 *
 * @typedef {Object} Portion
 * @property {string} label   e.g. "150 g"
 * @property {number|null} grams  weight of that measure; null when unknown
 *
 * @typedef {Object} Food
 * @property {string} id
 * @property {string} name
 * @property {string} serving   human label, e.g. "100 g"
 * @property {number} calories
 * @property {number} protein
 * @property {number} carbs
 * @property {number} fat
 * @property {string[]} tags
 * @property {string[]} diet    vegetarian | vegan | gluten-free | high-protein | low-carb |
 *                              eggetarian | non-vegetarian | jain
 * @property {FoodCategory} category
 * @property {'ingredient'|'dish'} [kind]   absent means 'ingredient'
 * @property {Micros} [micros]              per the stated serving; absent means unknown
 * @property {Portion[]} [portions]         household measures for this food
 *
 * @typedef {Object} FoodItem
 * @property {string} id        row id, unique inside a meal
 * @property {string} foodId    Food.id, or a synthetic id for custom entries
 * @property {string} name
 * @property {string} serving
 * @property {number} quantity  multiplier already applied to the macros below
 * @property {number} calories
 * @property {number} protein
 * @property {number} carbs
 * @property {number} fat
 * @property {Micros} [micros]        scaled micronutrients for this quantity
 * @property {boolean} [microsKnown]  false when the source food had no micro data
 * @property {string} [portionLabel]  e.g. "300 g"
 * @property {number|null} [grams]    resolved weight, null when unknown
 * @property {Macros} [base]          per-unit macros, kept for exact re-quantifying
 * @property {Micros|null} [baseMicros]
 *
 * @typedef {Object} Meal
 * @property {string} id
 * @property {MealType} type
 * @property {string} time      ISO timestamp
 * @property {FoodItem[]} items
 * @property {Macros} total     sum of items, maintained by the slice
 *
 * @typedef {Object} DailyLog
 * @property {string} date      YYYY-MM-DD local
 * @property {Meal[]} meals
 * @property {number} water     millilitres
 * @property {Macros} totals    sum of all meal items
 * @property {Micros} micros    sum of all item micronutrients
 *
 * @typedef {Object} DaySummary
 * @property {string} date      YYYY-MM-DD local
 * @property {number} calories
 * @property {number} protein
 * @property {number} carbs
 * @property {number} fat
 * @property {number} water     millilitres
 * @property {Micros} micros
 *
 * @typedef {Object} AuthUser
 * @property {string} id
 * @property {string} email
 * @property {string} displayName
 * @property {string} createdAt ISO
 * @property {AuthMode} provider
 *
 * @typedef {Object} Targets
 * @property {number} calories
 * @property {number} protein
 * @property {number} carbs
 * @property {number} fat
 * @property {number} water     millilitres
 * @property {number} steps
 * @property {number} sleep     hours
 * @property {Micros} [micros]  reference intakes resolved from ICMR-NIN 2020
 *
 * @typedef {Object} Recipe
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {number} minutes
 * @property {number} servings
 * @property {'easy'|'medium'|'hard'} difficulty
 * @property {string[]} tags
 * @property {string[]} diet
 * @property {number} calories  per serving
 * @property {number} protein
 * @property {number} carbs
 * @property {number} fat
 * @property {{ name: string, quantity: number, unit: string }[]} ingredients
 * @property {string[]} steps
 *
 * @typedef {Object} Workout
 * @property {string} id
 * @property {string} name
 * @property {'strength'|'cardio'|'hiit'|'mobility'} type
 * @property {number} minutes
 * @property {number} calories
 * @property {'low'|'moderate'|'high'} intensity
 * @property {string[]} equipment
 * @property {{ name: string, sets: number, reps: string }[]} exercises
 * @property {string} description
 *
 * @typedef {Object} WorkoutLog
 * @property {string} id
 * @property {string} workoutId
 * @property {string} name
 * @property {number} minutes
 * @property {number} calories
 * @property {string} date      YYYY-MM-DD
 * @property {string} createdAt ISO
 * @property {{ name: string, sets: { reps: number, weightKg: number, done: boolean }[] }[]} [exercises]
 *
 * @typedef {'steps'|'water'|'workouts'} ChallengeMetric
 *
 * @typedef {Object} Challenge
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {number} days
 * @property {ChallengeMetric} metric
 * @property {number} dailyGoal
 * @property {string} unit
 *
 * @typedef {Object} ChallengeProgress
 * @property {string} id         Challenge.id
 * @property {string} startedAt  YYYY-MM-DD
 * @property {string[]} days     completed dates
 *
 * @typedef {Object} Post
 * @property {string} id
 * @property {string} body
 * @property {string} createdAt ISO
 * @property {string} authorName
 * @property {string[]} likedBy  user ids
 * @property {{ id: string, authorName: string, body: string, createdAt: string }[]} comments
 *
 * @typedef {'weight'|'calories'|'water'|'steps'|'protein'|'workouts'|'custom'} GoalKind
 *
 * @typedef {Object} Goal
 * @property {string} id
 * @property {GoalKind} kind
 * @property {string} title
 * @property {number} target
 * @property {string} unit
 * @property {number|null} start
 * @property {string} createdAt ISO
 * @property {string|null} completedAt ISO
 *
 * @typedef {Object} WeekPlanDay
 * @property {string} date YYYY-MM-DD
 * @property {{ breakfast: string|null, lunch: string|null, dinner: string|null, snack: string|null }} recipeIds
 *
 * @typedef {Object} WeekPlan
 * @property {string} weekStart YYYY-MM-DD
 * @property {WeekPlanDay[]} days
 *
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {string} text
 * @property {'user'|'coach'} sender
 * @property {string} timestamp ISO
 *
 * @typedef {Object} FaqEntry
 * @property {string} id
 * @property {string} category
 * @property {string} question
 * @property {string} answer
 */

export {};
